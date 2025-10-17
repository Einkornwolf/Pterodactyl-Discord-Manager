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
  customId: "addShopItemModal",
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
    let { fields, user: { id }, user } = interaction, itemName = fields.getTextInputValue("itemName"), itemPrice = fields.getTextInputValue("itemPrice"), itemDescription = fields.getTextInputValue("itemDescription"), itemRuntime = fields.getTextInputValue("itemRuntime"), fetchedUser = await user.fetch(true), { accentColor } = fetchedUser, itemType = "server"// maybe in the next api update :("item_type_selector ).data.values[0]

    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined

    let data = {
      name: itemName,
      type: itemType,
      price: itemPrice,
      description: itemDescription,
      runtime: itemRuntime,
    };

    //Cache Data
    await cacheManager.cacheData(id, data)

    const confirmEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_confirm")) || "✅";
    const denyEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_deny")) || "❌";

    //Check if item_price is a number
    if (isNaN(itemPrice) || itemPrice < 0 || itemPrice % 1 !== 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("shop_manager.main_label")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("add_item_modal_second.price_no_number_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
        ],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    //maybe in the next api update if(item_type == 'item_server') {
    if (itemType) {
      //Reply with Confirmation
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_glass")} ${await t("add_item_modal.confirm_label")}`)
            .addFields(
              { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("add_item_button.modal_name")}`, value: `\`\`\`js\n${itemName}\`\`\``, inline: true },
              { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} Typ`, value: `\`\`\`js\n$Server\`\`\``, inline: true },
              { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("add_item_button.modal_price")}`, value: `\`\`\`js\n${itemPrice}\`\`\``, inline: true },
              { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("add_item_button.modal_description")}`, value: `\`\`\`js\n${itemDescription}\`\`\``, inline: true },
              { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("add_item_button.modal_runtime")}`, value: `\`\`\`js\n${itemRuntime}\`\`\``, inline: true }
            )
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setStyle("Success")
              .setCustomId("addShopItemConfirm")
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
    }
  },
};
