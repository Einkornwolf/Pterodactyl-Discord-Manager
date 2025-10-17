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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("../../classes/emojiManager")


module.exports = {
  customId: "addServerItemConfirm",
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
    const user = interaction.user;
    const id = user.id;
    const tag = user.tag;
    const fetchedUser = await user.fetch(true);
    const { accentColor } = fetchedUser;
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;
    let cachedData = await cacheManager.getCachedData(id)

    //No cached data
    if (cachedData == undefined) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
    let addServerDataModal = new ModalBuilder()
      .setCustomId("addServerItemDataModal")
      .setTitle("Add Shop Item");

    const itemCpu = new TextInputBuilder()
      .setCustomId("serverCpu")
      .setLabel(`${await t("add_item_modal_confirm.data_modal_cpu_text")}`)
      .setPlaceholder(`${await t("add_item_modal_confirm.data_modal_cpu_ph_text")}`)
      .setStyle(TextInputStyle.Short);

    const itemRam = new TextInputBuilder()
      .setCustomId("serverRam")
      .setLabel(`${await t("add_item_modal_confirm.data_modal_ram_text")}`)
      .setPlaceholder(`${await t("add_item_modal_confirm.data_modal_ram_ph_text")}`)
      .setStyle(TextInputStyle.Short);

    const itemDisk = new TextInputBuilder()
      .setCustomId("serverDisk")
      .setLabel(`${await t("add_item_modal_confirm.data_modal_disk_text")}`)
      .setPlaceholder(`${await t("add_item_modal_confirm.data_modal_disk_ph_text")}`)
      .setStyle(TextInputStyle.Short);

    const itemSwap = new TextInputBuilder()
      .setCustomId("serverSwap")
      .setLabel(`${await t("add_item_modal_confirm.data_modal_swap_text")}`)
      .setPlaceholder(`${await t("add_item_modal_confirm.data_modal_swap_ph_text")}`)
      .setStyle(TextInputStyle.Short);

    const itemBackups = new TextInputBuilder()
      .setCustomId("serverBackups")
      .setLabel(`${await t("add_item_modal_confirm.data_modal_backup_text")}`)
      .setPlaceholder(`${await t("add_item_modal_confirm.data_modal_cpu_ph_text")}`)
      .setStyle(TextInputStyle.Short);


    addServerDataModal.addComponents([
      new ActionRowBuilder().addComponents([itemCpu]),
      new ActionRowBuilder().addComponents([itemRam]),
      new ActionRowBuilder().addComponents([itemDisk]),
      new ActionRowBuilder().addComponents([itemSwap]),
      new ActionRowBuilder().addComponents([itemBackups])
    ]);
    //Show Modal
    await interaction.showModal(addServerDataModal);
  },
};
