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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags } = require("discord.js")
const dotenv = require("dotenv")
dotenv.config({
  path: "./config.env",
});
let priceOffset = process.env.PRICE_OFFSET;
const { EmojiManager } = require("../../classes/emojiManager")

module.exports = {
  customId: "extendServer",

  /**
   * Delete server
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
    //Check if Server still exists
    if (typeof (server) == undefined || !server) {
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
    let { attributes: { id: serverId, uuid, identifier } } = server;
    let runtimeList = await panel.getRuntimeList(), deletionList = await panel.getDeletionList();
    let runtimeData = runtimeList.find(s => s.uuid == uuid), deletionData = deletionList ? deletionList.find(s => s.uuid == uuid) : null;
    let { runtime, price } = runtimeData ? runtimeData : (deletionData || {});
    //Check if user has enough coins
    if (!price || userData.balance < (price * priceOffset)) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.not_enough_coins.text")}** \`${price * priceOffset}\` **${await t("shop_select.not_enough_coins.text_two")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral
      })
      return
    }

    //Extend Runtime by Standard Amount of set Runtime with price increase / decrease set in config
    if (deletionData && !runtimeData) await panel.unSuspendServer(serverId)
    await economyManager.removeCoins(id, (price * priceOffset))
    await panel.extendRuntime(identifier, runtime)

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("server_manager_events.main_label")}`)
          .addFields(
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("server_manager_events.runtime_text")}`, value: ``, inline: false },
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("shop.price_label")}`, value: `\`\`\`js\n${price * priceOffset}\`\`\``, inline: true },
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("server_manager_events.runtime_text_two")}`, value: `\`\`\`js\n${runtime} ${await t("server_manager_events.runtime_text_three")}\`\`\``, inline: true }
          )
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
          .setTimestamp()
      ],
      flags: MessageFlags.Ephemeral
    });
  },
};
