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
    .setName("change-user-mail")
    .setDescription("Admin-Command. Warning: Changes eMail only in the bots database, not on the Panel!")
    .addUserOption((option) =>
      option.setName("user").setDescription("Benutzer").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("mail").setDescription("E-Mail").setRequired(true)
    ),
  /**
   * Admin command for changes users email
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
    let { user: { id: userId, tag }, user: iUser } = interaction, fetchedUser = await iUser.fetch(true), { accentColor } = fetchedUser
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    //Check if User is on the Admin List
    if (!process.env.ADMIN_LIST.includes(userId)) {
      await interaction.editReply({
        embeds: [
            new EmbedBuilder()
              .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.no_admin_label")} ${await emojiManager.getEmoji("emoji_error")}`)
              .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("errors.no_admin_text")}**`)
              .setColor(accentColor ? accentColor : 0xe6b04d)
              .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
              .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral,
        });
      await logManager.logString(`${tag} tried to use /switch_mails without admin permissions`)
      return;
    }

    //Change User Mail in DB
    let user = interaction.options.getUser("user"), userData = await databaseInterface.getObject(user.id), newMail = interaction.options.getString("mail");
    //Check if Receipient has an Account
    if (userData == null) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("switch_mail.no_account_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("switch_mail.no_account_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral
      });
      await logManager.logString(`${tag} tried to change the Database E-Mail from a User who does not have an Account`)
      return;
    }


    //Request Mail Change
    await databaseInterface.changeUserMail(user.id, newMail)

    //Reply
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
        .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("switch_mail.main_label")}`)
        .setDescription(`\`\`\`${await t("switch_mail.main_text")}\`\`\``)
        .setColor(accentColor ? accentColor : 0xe6b04d)
        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
        .setTimestamp()
      ],
      flags: MessageFlags.Ephemeral,
    });
    await logManager.logString(`${tag} changed the Mail of ${user.tag} to "${newMail}"`)
  },
};
