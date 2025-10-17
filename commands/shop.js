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
const { BaseInteraction, Client, StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Buy Servers with Coins"),
  /**
   * Shop
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
   * @returns 
   */
  async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    let { user: { id: userId, tag }, user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    let userData = await databaseInterface.getObject(userId), shopItems = await databaseInterface.getObject("shop_items_servers");
    //Check if User has an Account
    const playEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_play")) || "▶️";

    if (userData == null) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop.no_account_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral,
      });
      //Logging
      await logManager.logString(`${tag} tried to use /shop without an Account`)
      return;
    }

    //Create Embed
    let shopEmbed = new EmbedBuilder()
      .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("shop.main_label")}`)
      .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop.main_text")}**`)
      .setColor(accentColor ? accentColor : 0xe6b04d)
      .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
      .setTimestamp();


    //Create Select Menu
    let shopSelect = new StringSelectMenuBuilder()
      .setCustomId("createSelectedItem")

    //Check if Shop is empty
    switch (shopItems == null) {
      case true: {
        //Empty
        shopEmbed.addFields([
          {
            name: `${await emojiManager.getEmoji("emoji_deny")} ${await t("shop.no_items_label")}`,
            value: `${await t("shop.no_items_text")}`,
          }
        ]);
        shopEmbed.setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL }).setTimestamp()

        await interaction.editReply({
          embeds: [shopEmbed],
          flags: MessageFlags.Ephemeral
        })
        break;
      }
      case false: {
        //Not empty
        for (let item of shopItems) {
          //Add Embed Fields
          shopEmbed.addFields([
            {
              name: `${await emojiManager.getEmoji("emoji_file")} ${item.data.name}`,
              value: `${await t("add_item_button.modal_price")} \`\`\`js\n${item.data.price} Coins\`\`\`${await t("add_item_button.modal_description")} \`\`\`js\n${item.data.description}\`\`\``,
              inline: true
            },
          ])
          //Add Select Menu Fields
          shopSelect.addOptions([
            {
              label: `${await t("shop.item_label")} #${shopItems.indexOf(item)}`,
              description: `${item.data.name}`,
              value: `${shopItems.indexOf(item)}`,
              emoji: playEmoji,
            },
          ])
        }
        await interaction.editReply({
          embeds: [shopEmbed],
          components: [new ActionRowBuilder().addComponents(shopSelect)],
          flags: MessageFlags.Ephemeral
        })
      }
    }
  }
};
