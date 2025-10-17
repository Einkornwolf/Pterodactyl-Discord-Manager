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
  customId: "renameModal",
  /**
   * Rename server modal
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
    let { fields, message: { embeds }, user: { id, tag }, user } = interaction, { fields: embedFields } = embeds[0], { value } = embedFields[3]  , fetchedUser = await user.fetch(true), { accentColor } = fetchedUser, uuidField = value.substring(6), uuid = uuidField.substring(0, uuidField.length-3)
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    //Get server data
    let newServerName = fields.getTextInputValue("serverRenameText"), userData = await databaseInterface.getObject(id), { e_mail } = userData, userServers = await panel.getAllServers(e_mail)
    let server = userServers.find(server => {
      let { attributes: { uuid: objectUuid } } = server
      return objectUuid == uuid
    })
    let { attributes: { identifier } } = server
    //Rename Server
    await panel.renameServer(identifier, newServerName)
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("server_manager_pagination.main_text")}`)
          .addFields(
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("rename_modal.main_text")}`, value: `\`\`\`${newServerName}\`\`\`` }
          )
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
          .setTimestamp()
      ],
      flags: MessageFlags.Ephemeral
    });

    //Logging
    await logManager.logString(`${tag} renamed his Server with the identifier ${identifier} to ${newServerName}`)
  },
};
