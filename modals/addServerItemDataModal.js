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
  customId: "addServerItemDataModal",
  /**
   * Create a shop item
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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let { fields, user: { tag, id }, user } = interaction, itemCpu = fields.getTextInputValue("serverCpu"), itemRam = fields.getTextInputValue("serverRam"), fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    let itemDisk = fields.getTextInputValue("serverDisk"), itemSwap = fields.getTextInputValue("serverSwap"), itemBackups = fields.getTextInputValue("serverBackups")
    let cachedData = await cacheManager.getCachedData(id), { name, price, runtime, description, egg_id: eggId, server_databases: serverDatabases } = cachedData


    //Get Data
    let data = {
      name: name,
      price: price,
      description: description,
      runtime: runtime,
      egg_id: eggId,
      server_databases: serverDatabases,
      server_cpu: itemCpu,
      server_ram: itemRam,
      server_disk: itemDisk,
      server_swap: itemSwap,
      server_backups: itemBackups,
    };
    //Cache Data
    await cacheManager.cacheData(id, data)

    const confirmEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_confirm")) || "✅";
    const denyEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_deny")) || "❌";

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_glass")} ${await t("add_item_modal.confirm_label")}`)
          .addFields(
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")}  ${await t("serverinfo.cpu")}`, value: `\`\`\`js\n${itemCpu} %\`\`\``, inline: true },
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.ram")}`, value: `\`\`\`js\n${itemRam} MB\`\`\``, inline: true },
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.disk")}`, value: `\`\`\`js\n${itemDisk} MB\`\`\``, inline: true },
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.swap")}`, value: `\`\`\`js\n${itemSwap} MB\`\`\``, inline: true },
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("add_item_modal_confirm.data_modal_backup_text")}`, value: `\`\`\`js\n${itemBackups}\`\`\``, inline: true }
          )
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
          .setTimestamp()
      ],
      flags: MessageFlags.Ephemeral,
      //Confirm Button
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setStyle("Success")
            .setCustomId("addShopItemDataConfirm")
            .setLabel(`${await t("add_item_modal.button_confirm_text")}`)
            .setEmoji(confirmEmoji),


          new ButtonBuilder()
            .setStyle("Danger")
            .setCustomId("addShopItemCancel")
            .setLabel(`${await t("add_item_modal.button_cancel_text")}`)
            .setEmoji(denyEmoji)
        )
      ],
    });
  },
};
