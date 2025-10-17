/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { SlashCommandBuilder } = require("@discordjs/builders")
const { TranslationManager } = require("../../classes/translationManager")
const { PanelManager } = require("../../classes/panelManager")
const { BoosterManager } = require("../../classes/boosterManager")
const { CacheManager } = require("../../classes/cacheManager")
const { EconomyManager } = require("../../classes/economyManager")
const { LogManager } = require("../../classes/logManager")
const { DataBaseInterface } = require("../../classes/dataBaseInterface")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("../../classes/emojiManager")

module.exports = {
  customId: "startServer",

  /**
   * Start server
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
   */
  async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let { message: { embeds } } = interaction;
    const user = interaction.user;
    const id = user.id;
    const tag = user.tag;
    const fetchedUser = await user.fetch(true);
    const { accentColor } = fetchedUser;
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;
    //Get Server ID
    let { data: { fields, title } } = embeds[0];
    let { value } = fields[3];
    let serverUuid = (value.substring(6)).substring(0, (value.substring(6).length - 3));
    let serverIndex = title.slice(title.lastIndexOf("#") + 1);
    let userData = await databaseInterface.getObject(id);
    let userServers = await panel.getAllServers(userData.e_mail);
    let server = userServers.find(s => s.attributes.uuid == serverUuid);
    let installStatus = await panel.getInstallStatus(server ? server.attributes.identifier : undefined);

    //Check if Server is available or is still being installed or deleted
    if (typeof(server) == undefined || !server || installStatus == false) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("server_manager_events.server_not_found_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral
      })
      return;
    }

    //Destructure server
    let { attributes: { id: serverId, identifier } } = server;

    //Start Server
    await panel.powerEventServer(identifier, "start")
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("server_manager_events.main_label")}`)
          .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("server_manager_events.start_server_text")}**`)
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
          .setTimestamp()
      ],
      flags: MessageFlags.Ephemeral
    });
    //Logging
    await logManager.logString(`${tag} started his Server with the identifier ${identifier}`)
    return;
  },
 };
