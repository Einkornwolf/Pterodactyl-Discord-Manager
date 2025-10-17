/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { PanelManager } = require("./../classes/panelManager")
const { TranslationManager } = require("./../classes/translationManager")
const { BoosterManager } = require("./../classes/boosterManager")
const { CacheManager } = require("./../classes/cacheManager")
const { EconomyManager } = require("./../classes/economyManager")
const { LogManager } = require("./../classes/logManager")
const { DataBaseInterface } = require("./../classes/dataBaseInterface")
const { UtilityCollection } = require("./../classes/utilityCollection")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
  customId: "creationModal",
  /**
   * Create an account on the panel
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
    //Get Modal Data
    let { fields, user: { id, tag }, user } = interaction, eMail = fields.getTextInputValue("usereMail"), name = fields.getTextInputValue("userName"), fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    //Add User to Database and API
    let status, userRequest
    try {
      userRequest = await panel.addUser(eMail, name, name, name), status = 201
    } catch (e) {
      status = e.response.status
    }
    await databaseInterface.setUser(id, eMail, name)
    //Logging
    await logManager.logString(`${tag} has been added to the Bot-Database. Credentials: ${eMail}, ${name}`)


    //Account Creation Failed
    if (status != 201) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("account_manager_events.account_creation_fail_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
    flags: MessageFlags.Ephemeral,
      });


      //Logging
      await logManager.logString(`${tag}'s credentials could not be added to Panel. Process has been aborted and their credentials were deleted from the Bot-Database.`)
      //Remove Account from Database due to failed Panel Creation
      await databaseInterface.deleteUser(id)
      return;
    }


    //Account Creation sucessfull
    let { config: { data } } = userRequest, { password } = JSON.parse(data)
    //Reply to User
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("account_manager_events.account_creation_success_label")}`)
          .addFields(
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("account_manager_events.account_creation_success_text")}`, value: `\`\`\`js\n${password}\`\`\`` },
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("account_manager_events.account_creation_success_text_two")}`, value: `\`\`\`${process.env.PTERODACTYL_API_URL}\`\`\`` }
          )
          .setURL(process.env.PTERODACTYL_API_URL)
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
          .setTimestamp()
      ],
  flags: MessageFlags.Ephemeral
    });
    //Logging
    await logManager.logString(`${tag} created a Panel-Account. Credentials: ${eMail}, ${name}`)
    return;
  },
};
