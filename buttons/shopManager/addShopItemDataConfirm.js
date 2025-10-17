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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js");
const { data } = require("../../commands/serverManager");

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("../../classes/emojiManager")


module.exports = {
  customId: "addShopItemDataConfirm",
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
    const user = interaction.user;
    const id = user.id;
    const tag = user.tag;
    const fetchedUser = await user.fetch(true);
    const { accentColor } = fetchedUser;
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;
    let cachedData = await cacheManager.getCachedData(id)
    await cacheManager.clearCache(id)

    //No cached data
    if (cachedData == undefined) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("add_item_modal_confirm.no_saved_data_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }


    //Server Item Creation Modal
    let addServerModal = new ModalBuilder({})
      .setCustomId("addServerItemModal")
      .setTitle("Add Shop Item");

    const itemEgg = new TextInputBuilder()
      .setCustomId("serverEggId")
      .setLabel(`${await t("add_item_modal_confirm.data_modal_egg_text")}`)
      .setPlaceholder(`${await t("add_item_modal_confirm.data_modal_egg_ph_text")}`)
      .setStyle(TextInputStyle.Short);

    const itemDatabases = new TextInputBuilder()
      .setCustomId("serverDatabases")
      .setLabel(`${await t("add_item_modal_confirm.data_modal_db_text")}`)
      .setPlaceholder(`${await t("add_item_modal_confirm.data_modal_disk_ph_text")}`)
      .setStyle(TextInputStyle.Short);

    addServerModal.addComponents([
      new ActionRowBuilder().addComponents([itemEgg]),
      new ActionRowBuilder().addComponents([itemDatabases])
    ]);
    //Show Modal
    //    await interaction.showModal(addServerModal);
    //    return;
    //Check configuration (same logic as before)
    let { server_cpu: cpu, server_ram: ram, server_disk: disk, server_swap: swap, server_backups: backups, egg_id } = cachedData
    let nestData = await panel.getNestData();
    let chosenNestData = nestData.find(nest => nest.attributes.relationships.eggs.data.some(egg => egg.attributes.id == egg_id))
    if (!chosenNestData || !Number.isFinite(parseInt(cpu)) || !Number.isFinite(parseInt(ram)) || !Number.isFinite(parseInt(disk)) || !Number.isFinite(parseInt(swap)) || !Number.isFinite(parseInt(backups)) || !Number.isFinite(parseInt(egg_id))) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.configuration")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await databaseInterface.addShopItem("server", cachedData)

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("add_item_modal_confirm.main_label")}`)
          .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("add_item_modal_confirm.shop_item_created_text")}**`)
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
          .setTimestamp()
      ],
      flags: MessageFlags.Ephemeral
    });
    //Logging
    await logManager.logString(`${tag} succesfully added an item to the Shop: CPU: ${cpu}, RAM: ${ram}, DISK: ${disk}, SWAP: ${swap}, BACKUPS: ${backups}`)
    return;
  },
};
