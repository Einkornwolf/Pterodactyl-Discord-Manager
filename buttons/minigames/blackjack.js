/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");
const { TranslationManager } = require("../../classes/translationManager")
const { PanelManager } = require("../../classes/panelManager")
const { BoosterManager } = require("../../classes/boosterManager")
const { CacheManager } = require("../../classes/cacheManager")
const { EconomyManager } = require("../../classes/economyManager")
const { LogManager } = require("../../classes/logManager")
const { DataBaseInterface } = require("../../classes/dataBaseInterface")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags  } = require("discord.js")
const { playGame } = require("../../lib/blackjackEngine")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("../../classes/emojiManager")

module.exports = {
  customId: "blackjack",

  /**
   *
   * @param {BaseInteraction} interaction 
   * @param {Client} client
   * @param {PanelManager} panel 
   * @param {BoosterManager} boosterManager 
   * @param {CacheManager} cacheManager 
   * @param {EconomyManager} economyManager 
   * @param {LogManager} logManager 
   * @param {DataBaseInterface} databaseInterface
   * @param {TranslationManager} t
   * @param {GiftCodeManager} giftCodeManager
   * @param {EmojiManager} emojiManager
   */
  async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
    // Defer reply as ephemeral so follow ups are hidden
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const user = interaction.user;
    const id = user.id;
    const tag = user.tag;
    const fetchedUser = await user.fetch(true);
    const { accentColor } = fetchedUser;
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;
    const channel = interaction.channel;
    const userBalance = await economyManager.getUserBalance(id);
    const userDaily = await economyManager.getUserDaily(id);
    //Einsatz Embeds und Select

    const einsatzEmbed = new EmbedBuilder()
      .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("minigames_events.bet_label")}`)
      .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("minigames_events.bet_text")}**`)
      .setColor(accentColor ? accentColor : 0xe6b04d)
      .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
      .setTimestamp()


    const einsatzNoNumber = new EmbedBuilder()
      .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
      .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("minigames_events.daily_limit_reached_text")}**`)
      .setColor(accentColor ? accentColor : 0xe6b04d)
      .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
      .setTimestamp()


    await interaction.editReply({
      embeds: [einsatzEmbed]
    });

    //Get Messages and Filter for the Users bet
    const filter = (m) => m.author.id === id;
    const blackjackCollector = channel.createMessageCollector({
      filter,
      time: 15000,
      max: 1,
    });

    blackjackCollector.on("collect", async (collected) => {
      let { content: einsatz } = collected
      einsatz = parseInt(einsatz)
      //Try to delete message
      try {
        await collected.delete();
      } catch { }
      //Check if the set User Amount is let than 0
        if (Number.isFinite(einsatz) == false || einsatz <= 0 || einsatz > 150) {
        await interaction.editReply({
          embeds: [einsatzNoNumber]
        });
        //Logging
        await logManager.logString(`${tag} tried to play a minigame with insufficient coins / remaining daily limit.`)
        return;
      }

      //Check if user has enough coins, reached his daily limit, or would reach his daily limit
        if (einsatz * 1.5 > userBalance || userDaily >= 300 || (300 - userDaily) < (einsatz * 1.5)) {
        await interaction.editReply({
          embeds: [einsatzNoNumber]
        });
        //Logging
        await logManager.logString(`${tag} tried to play a minigame with insufficient coins / remaining daily limit.`)
        return;
      }
      try {
        // charge base bet up-front
        await economyManager.removeCoins(id, einsatz)

        const res = await playGame(interaction, { transition: "update", bet: einsatz, t });
        const { result, outcomes = [], dealer, multipliers = [] } = res;

        // multipliers: array of 1 or 2 per hand (double)

        // determine multipliers (array) and outcomes (array)
        const multipliersArr = multipliers.length ? multipliers : outcomes.map(() => 1)

  // charge extra stakes for splits and doubles (we already removed the base bet once)
  // - For each additional hand created by a split we must charge one extra base bet.
  // - For each doubled hand we must charge an extra base bet (multiplier - 1).
  const extraCharges = multipliersArr.reduce((acc, m) => acc + (m - 1) * einsatz, 0) + Math.max(0, multipliersArr.length - 1) * einsatz
        if (extraCharges > 0) await economyManager.removeCoins(id, extraCharges)

        // compute payouts
        let totalStake = 0
        let totalPayout = 0
        for (let i = 0; i < multipliersArr.length; i++) {
          const m = multipliersArr[i]
          const stake = einsatz * m
          totalStake += stake
          const out = outcomes[i] || 'LOSE'
          if (out === 'WIN') {
            // check for natural blackjack payout (3:2)
            const isNatural = (res.naturals && res.naturals[i])
            const dealerNatural = res.dealerNatural
            if (isNatural && !dealerNatural) {
              // player gets 3:2 on top of their stake
              // return stake + 1.5 * stake as profit => stake * 2.5 total
              totalPayout += Math.floor(stake * 2.5)
            } else {
              // standard win: return stake + equal profit => stake*2
              totalPayout += stake * 2
            }
          } else if (out === 'PUSH') {
            // return stake
            totalPayout += stake
          } else {
            // LOSE => nothing
          }
        }

        // apply payouts in a single operation for efficiency
        if (totalPayout > 0) await economyManager.addCoins(id, totalPayout)
        if (totalPayout > 0) await economyManager.addDailyAmount(id, Math.max(0, totalPayout - totalStake))

        // Build reply summary
        const net = totalPayout - totalStake
        const title = net > 0 ? (await t('minigames.result_win')) : (net < 0 ? (await t('minigames.result_loss')) : (await t('minigames.result_cancel')))

        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("minigames.blackjack_label")} — ${title}`)
              .setColor(accentColor ? accentColor : (net > 0 ? 0x1f8b4c : 0x8b1c1c))
              .addFields(
                { name: (await t('minigames.your_bet')), value: `${einsatz}`, inline: true },
                { name: (await t('minigames.won_amount')), value: `${Math.max(0, totalPayout - totalStake)}`, inline: true },
                { name: (await t('minigames.loss_amount')), value: `${Math.max(0, totalStake - totalPayout)}`, inline: true },
              )
              .setFooter({ text: `${(await t('minigames.daily_total'))}: ${await economyManager.getUserDaily(id)}`, iconURL: serverIconURL })
              .setTimestamp()
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setStyle('Primary')
                .setCustomId('blackjack')
                .setLabel(`🔁 ${await t("minigames.replay_label")}`)
            )
          ],
          flags: MessageFlags.Ephemeral
        });
        // Logging
        await logManager.logString(`${tag} settled blackjack: stake=${totalStake} payout=${totalPayout} net=${net}`)
        return;
      } catch (err) {
        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${(await t("errors.error_label"))} — ${(await t('minigames.result_error'))} ${await emojiManager.getEmoji("emoji_error")}`)
              .setColor(accentColor ? accentColor : 0x8b1c1c)
              .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("minigames_events.blackjack_error_text")}**`)
              .setFooter({ text: `${(await t('minigames.help_contact'))}`, iconURL: serverIconURL })
              .setTimestamp()
          ],
          flags: MessageFlags.Ephemeral
        });
        // Logging
        await logManager.logString(`${tag}'s Blackjack Game resulted in an error: ${err}`)
        return;
      }
    });
  },
};
