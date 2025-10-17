/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { PanelManager } = require("../classes/panelManager")
const { TranslationManager } = require("./../classes/translationManager")
const { BoosterManager } = require("./../classes/boosterManager")
const { CacheManager } = require("./../classes/cacheManager")
const { EconomyManager } = require("./../classes/economyManager")
const { LogManager } = require("./../classes/logManager")
const { DataBaseInterface } = require("./../classes/dataBaseInterface")
const { UtilityCollection } = require("./../classes/utilityCollection")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("minigames")
    .setDescription("Play with your luck! Earn coins!"),
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
   * @param {EmojiManager} emojiManager
   * @returns 
   */
  async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    let { user: { id: userId, tag }, user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser, userData = await databaseInterface.getObject(userId)
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    //Check if User has an Account
    if (userData == null) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.no_account_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("minigames.no_account_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral,
      });
      //Logging
      await logManager.logString(`${tag} tried to use /minigames without an Account`)
      return;
    }

    const playEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_play")) || "▶️";

    //Reply to User
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("minigames.main_label")}`)
          .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("minigames.main_text")}`)
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
          .setTimestamp()
      ],
      components: [
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setStyle("Primary")
              .setLabel(await t("minigames.zahlen_label"))
              .setCustomId("zahlenRaten")
              .setEmoji(playEmoji),

            new ButtonBuilder()
              .setStyle("Primary")
              .setLabel(await t("minigames.blackjack_label"))
              .setCustomId("blackjack")
              .setEmoji(playEmoji),

            new ButtonBuilder()
              .setStyle("Primary")
              .setLabel(await t("minigames_events.difficulty_label"))
              .setCustomId("trivia")
              .setEmoji(playEmoji),
          )
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
