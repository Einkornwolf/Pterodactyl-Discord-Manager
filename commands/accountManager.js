/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");
const { TranslationManager } = require("./../classes/translationManager")
const { PanelManager } = require("../classes/panelManager")
const { BoosterManager } = require("./../classes/boosterManager")
const { CacheManager } = require("./../classes/cacheManager")
const { EconomyManager } = require("./../classes/economyManager")
const { LogManager } = require("./../classes/logManager")
const { DataBaseInterface } = require("./../classes/dataBaseInterface")
const { BaseInteraction, Client, StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("account-manager")
    .setDescription("Create, manage or delete your account"),
  /**
   * 
   * Command for the user to manage his account
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
   * 
   */
  async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    let { user: { id: userId }, user: iUser } = interaction, fetchedUser = await iUser.fetch(true), { accentColor } = fetchedUser, userData = await databaseInterface.getObject(userId)

    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined

    const playEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_play"));
    const trashEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_trash"));
    const rotateEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_rotate"));
    const giftEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_gift"));

    let selectRow = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("accountSelect")
          .setPlaceholder(`${await t("account_manager.placeholder")}`)
          .addOptions(
            {
              label: `${await t("account_manager.link_label")}`,
              value: `linkAccount`,
              description: `${await t("account_manager.link_text")}`,
              default: false,
              emoji: playEmoji,
            },
            {
              label: `${await t("account_manager.create_label")}`,
              value: `createAccount`,
              description: `${await t("account_manager.create_text")}`,
              default: false,
              emoji: playEmoji,
            },
            {
              label: `${await t("account_manager.delete_label")}`,
              value: `deleteAccount`,
              description: `${await t("account_manager.delete_text")}`,
              default: false,
              emoji: trashEmoji,
            },
            {
              label: `${await t("account_manager.password_label")}`,
              value: `resetPassword`,
              description: `${await t("account_manager.password_text")}`,
              default: false,
              emoji: rotateEmoji,
            },
            {
              label: `${await t("account_manager.booster_label")}`,
              value: `claimBoosterReward`,
              description: `${await t("account_manager.booster_text")}`,
              default: false,
              emoji: giftEmoji,
            }
          )
      )

    let embed = new EmbedBuilder()
      .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("account_manager.main_label")}`)
      .setColor(accentColor ? accentColor : 0xe6b04d)
      .addFields(
        { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("account_manager.main_text")}`, value: `` },
        { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("account_manager.main_mail")}`, value: `\`\`\`js\n${userData != undefined ? userData.e_mail : await t("account_manager.no_account")}\`\`\`` },
        { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("account_manager.main_username")}`, value: `\`\`\`js\n${userData != undefined ? userData.name : await t("account_manager.no_account")}\`\`\`` },
        { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("account_manager.main_coins")}`, value: `\`\`\`js\n${userData != undefined ? (userData.balance == undefined ? 0 : userData.balance) : 0} Coins\`\`\`` }
      )
      .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
      .setTimestamp()

    //Reply to User
    await interaction.editReply({
      embeds: [embed],
      components: [selectRow],
      flags: MessageFlags.Ephemeral,
    });
  },
};
