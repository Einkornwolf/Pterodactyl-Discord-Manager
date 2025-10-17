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
  customId: "addServerItemModal",
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
    let { fields, user: { tag, id }, user } = interaction, itemEggId = fields.getTextInputValue("serverEggId"), itemDatabases = fields.getTextInputValue("serverDatabases"), fetchedUser = await user.fetch(true), { accentColor } = fetchedUser

    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined

    //Get Data from cache
    let cachedData = await cacheManager.getCachedData(id), { name, price, description, runtime } = cachedData

    let data = {
      name: name,
      price: price,
      description: description,
      runtime: runtime,
      egg_id: itemEggId,
      server_databases: itemDatabases,
    };

    //Write to Cache
    await cacheManager.cacheData(id, data)


    const confirmEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_confirm")) || "✅";
    const denyEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_deny")) || "❌";

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_glass")} ${await t("add_item_modal.confirm_label")}`)
          .addFields(
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.egg")}`, value: `\`\`\`js\n${itemEggId}\`\`\``, inline: true },
            { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")}  ${await t("add_item_modal_confirm.data_modal_db_text")}`, value: `\`\`\`js\n${itemDatabases}\`\`\``, inline: true }
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
            .setCustomId("addServerItemConfirm")
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
