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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("transfer-coins")
    .setDescription("Transfer Coins to another User")
    .addUserOption((option) =>
      option.setName("user").setDescription("Receiver").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("Amount").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("message").setDescription("Message").setRequired(false)
    )
  ,
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
    let { user: { id: userId, tag }, user: user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    let empfaenger = interaction.options.getUser("user"), transferAmount = interaction.options.getInteger("amount"), userData = await databaseInterface.getObject(userId), receiverData = await databaseInterface.getObject(empfaenger.id)
    let transferMessage = interaction.options.getString("message")


    //Check if user has an account
    if (userData == null) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("transfer_coins.no_account_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("transfer_coins.no_account_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral,
      });
      //Logging
      await logManager.logString(`${tag} tried to use /transfer_coins without an account`)
      return
    }


    //Check if recipient has an account
    if (receiverData == null) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("transfer_coins.no_account_receiver_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("transfer_coins.no_account_receiver_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral,
      });
      //Logging
      await logManager.logString(`${tag} tried to transfer Coins to a User who does not have an Account`)
      return
    }

    //Floor Value
    let flooredAmount = Math.floor(transferAmount)

    //Check if transfer amount is Valid
    if (!Number.isFinite(transferAmount) || !Number.isFinite(flooredAmount) || flooredAmount <= 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("transfer_coins.lower_than_zero_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("transfer_coins.lower_than_zero_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral,
      });
      //Logging
      await logManager.logString(`${tag} tried to transfer 0 Coins to ${empfaenger.tag}`)
      return;
    }


    //Check if User has enough Coins
    if (userData.balance < flooredAmount || userData.balance == undefined) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("transfer_coins.not_enough_coins_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("transfer_coins.not_enough_coins_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral,
      });
      //Logging
      await logManager.logString(`${tag} tried to transfer ${flooredAmount} Coins to ${empfaenger.tag}, but did not have enough Coins: ${await economyManager.getUserBalance(userId)}`)
      return;
    }


    //Remove Coins from User and add to Recipient
    await economyManager.removeCoins(userId, flooredAmount), await economyManager.addCoins(empfaenger.id, flooredAmount)
    // let user = interaction.client.users.cache.get(empfaenger.id);
    //Logging
    await logManager.logString(`${tag} transfered ${flooredAmount} Coin|s to ${empfaenger.tag}`)

    //Get recipients Languagee
    let empfaengerLanguage = new TranslationManager(empfaenger.id)
    let eT = async function (key) {
      return await empfaengerLanguage.getTranslation(key)
    }

    //Send DMs
    try {
      await empfaenger.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await eT("transfer_coins.main_label")}`)
            .addFields(
              { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${interaction.member.user.username} ${await eT("transfer_coins.dm_receive_text")}`, value: `\`\`\`js\n$ ${flooredAmount} Coin|s\`\`\`` },
              { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await eT("transfer_coins.dm_message_label")}`, value: `\`\`\`js\n${transferMessage ? transferMessage : "-"}\`\`\`` }
            )
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
      });
    } catch (e) { /*Recipient did not enable DMs*/ }
    try {
      await interaction.member.user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await eT("transfer_coins.main_label")}`)
            .addFields(
              { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${flooredAmount} ${await t("transfer_coins.dm_send_text")}`, value: `\`\`\`js\n${empfaenger.username}\`\`\`` },
              { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await eT("transfer_coins.dm_message_label")}`, value: `\`\`\`js\n${transferMessage ? transferMessage : "-"}\`\`\`` }
            )
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
      });
    } catch (e) { /*Sender did not enable DMs*/ }


    //Reply to User
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("transfer_coins.main_label")}`)
          .addFields(
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${flooredAmount} ${await t("transfer_coins.success_text")}`, value: `\`\`\`js\n${empfaenger.username}\`\`\`` }
          )
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
          .setTimestamp()
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
