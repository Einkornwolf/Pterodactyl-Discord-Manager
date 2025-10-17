/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { PanelManager } = require("../../classes/panelManager")
const { TranslationManager } = require("./../../classes/translationManager")
const { BoosterManager } = require("./../../classes/boosterManager")
const { CacheManager } = require("./../../classes/cacheManager")
const { EconomyManager } = require("./../../classes/economyManager")
const { LogManager } = require("./../../classes/logManager")
const { DataBaseInterface } = require("./../../classes/dataBaseInterface")
const { UtilityCollection } = require("./../../classes/utilityCollection")
const { EmojiManager } = require("../../classes/emojiManager")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js")
const dotenv = require('dotenv');

module.exports = {
  customId: "createSelectedItem",
  /**
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
    // dotenv + guild icon (Footer)
    dotenv.config({
      path: './config.env'
    })
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;

    // Normalize input values and load shop data
    const { user: { id: userId, tag }, values, user } = interaction;
    const shopItems = await databaseInterface.getObject("shop_items_servers");
    // values is an array from StringSelectMenu; take first selected value
    const selectedValue = Array.isArray(values) ? values[0] : values;
    const itemIndex = parseInt(selectedValue, 10);
    if (!shopItems || !Array.isArray(shopItems) || shopItems.length === 0) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.no_shop_items")}**`)
            .setColor(0xe6b04d)
            .setTimestamp()
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      await logManager.logString(`${tag} tried to buy but shop_items_servers is empty or missing.`);
      return;
    }
    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= shopItems.length) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.invalid_selection")}**`)
            .setColor(0xe6b04d)
            .setTimestamp()
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      await logManager.logString(`${tag} made an invalid shop selection: ${selectedValue}`);
      return;
    }

    const userBalance = await economyManager.getUserBalance(userId);
    const item = shopItems[itemIndex];
    if (!item || !item.data) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.configuration")}**`)
            .setColor(0xe6b04d)
            .setTimestamp()
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      await logManager.logString(`${tag} selected malformed shop item at index ${itemIndex}`);
      return;
    }

    const { data: { price, name, egg_id, server_ram, server_swap, server_disk, server_cpu, server_databases, server_backups, runtime } } = item;
    const userData = await databaseInterface.getObject(userId);
    const fetchedUser = await user.fetch(true);
    const { accentColor } = fetchedUser;
    const { e_mail } = userData || {};
    if (!e_mail) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop.no_account_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setTimestamp()
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      await logManager.logString(`${tag} tried to buy but no email (panel account) registered.`);
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    //Check if item is configured correctly
    //Get Nests
    let nestData = await panel.getNestData();
    //Get chosen Egg Data
    let chosenNestData = nestData.find(nest => nest.attributes.relationships.eggs.data.some(egg => egg.attributes.id == egg_id))

    if (!chosenNestData) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.configuration")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setTimestamp()
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
        ],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    //User does not have enough Coins
    if ((userBalance ? userBalance : 0) < price) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.not_enough_coins.text")} ${price} ${await t("shop_select.not_enough_coins.text_two")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setTimestamp()
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
        ],
        flags: MessageFlags.Ephemeral
      });
      //Logging
      await logManager.logString(`${tag} tried to buy a Shop Item with insufficient coins: ${userBalance}. Item Name: ${name}`)
      return;
    }

    // Create server with retries on 504 Gateway Timeout
    let server;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        server = await panel.createServer(
          e_mail,
          `${name} ${userId}`,
          egg_id,
          server_ram,
          server_swap,
          server_disk,
          500,
          server_cpu,
          server_databases,
          server_backups
        );
        break;
      } catch (e) {
        // If it's a 504, retry a couple of times with backoff
        const statusCode = e && e.response && e.response.status;
        await logManager.logString(`${tag} server creation attempt ${attempt} failed with ${e.message} (status: ${statusCode})`);
        if (statusCode == 504 && attempt < maxAttempts) {
          // wait with exponential/backoff (attempt * 1000ms)
          await new Promise((r) => setTimeout(r, attempt * 1000));
          continue;
        }
        // Non-retriable or max attempts reached: inform user and log
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
              .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.server_not_created_text")}**`)
              .setColor(accentColor ? accentColor : 0xe6b04d)
              .setTimestamp()
              .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL }),
          ],
          flags: MessageFlags.Ephemeral,
        });
        await logManager.logString(`${tag}'s shop item / server creation caused an error: ${e.stack || e.message}`);
        return;
      }
    }

    if (!server) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.server_not_created_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setTimestamp()
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      await logManager.logString(`${tag}'s shop item / server creation failed without response.`);
      return;
    }

    let { status, data: { attributes: { uuid } } } = server
    // Error with Server Creation
    if (status != 201 && status != 200) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.server_not_created_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setTimestamp()
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
        ],
        flags: MessageFlags.Ephemeral,
      });
      //Logging
      await logManager.logString(`${tag}'s shop item / server creation caused an error.`)
      return
    }

    //Remove Coins from user
    await economyManager.removeCoins(userId, price)

    //Add Server to runtime list
    if (runtime) {
      await panel.setServerRuntime(uuid, runtime, userId, price)
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("shop_select.shop_main_label")}`)
          .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_select.server_created_text")}**`)
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setTimestamp()
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
      ],
      flags: MessageFlags.Ephemeral
    });

    await logManager.logString(`${tag} bought a Shop Item with the Name: ${name} for ${price} Coins.`)
  }
}