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
//Initializte DotEnv
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop-manager")
    .setDescription("Admin Command to manage the shop"),
  /**
   * Admin-command for managing the /shop
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
    let { user: { id: userId, tag }, user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser, userData = await databaseInterface.getObject(userId)
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    let shopItems = await databaseInterface.getObject("shop_items_servers");
    const playEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_play")) || "▶️";
    const clipboardEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_clipboard")) || "📝";
    //Check if User is on the Admin List

    switch (process.env.ADMIN_LIST.includes(userId)) {
      case false: {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.no_admin_label")} ${await emojiManager.getEmoji("emoji_error")}`)
              .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("errors.no_admin_text")}**`)
              .setColor(accentColor ? accentColor : 0xe6b04d)
              .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
              .setTimestamp()
          ],
          flags: MessageFlags.Ephemeral,
        });
        //Logging
        await logManager.logString(`${tag} tried to use /shop_manager without admin permissions`)
        break;
      }
      case true: {
        //Create Embed
        let shopEmbed = new EmbedBuilder()
          .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("shop_manager.main_label")}`)
          .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_manager.main_text")}**`)
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
          .setTimestamp();


        //Create Select Menu
        let shopSelect = new StringSelectMenuBuilder()
          .setCustomId("selectShopItem")

        //Add add shop item select option
        shopSelect.addOptions([
          {
            label: `${await t("shop_manager.add_item_label")}`,
            description: `${await t("shop_manager.add_item_text")}`,
            value: "addShopItem",
            emoji: playEmoji,
          },
        ])


        //Check if Shop is empty
        switch (shopItems == null) {
          case true: {
            //Shop is empty
            shopEmbed.addFields([
              {
                name: `${await emojiManager.getEmoji("emoji_deny")} ${await t("shop_manager.no_items_label")}`,
                value: `${await t("shop_manager.no_items_text")}`,
              },
            ]);
            shopEmbed.setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL }).setTimestamp()

            await interaction.editReply({
              embeds: [shopEmbed],
              components: [new ActionRowBuilder().addComponents(shopSelect)],
              flags: MessageFlags.Ephemeral
            })
          }
          case false: {
            //Shop is not empty
            for (let [i, item] of shopItems.entries()) {
              //Add embed fields
              shopEmbed.addFields([
                {
                  name: `${await emojiManager.getEmoji("emoji_file")} ${item.data ? item.data.name : "N/A"}`,
                  value: `${await t("add_item_button.modal_price")}\`\`\`js\n${item.data ? item.data.price : "N/A"} Coins\`\`\`${await t("add_item_button.modal_description")}\`\`\`js\n${item.data ? item.data.description : "N/A"}\`\`\``,
                  inline: true,
                },
              ])

              //Add select menu options
              shopSelect.addOptions([
                {
                  label: `${await t("shop.item_label")} #${i}`,
                  description: `${item.data ? item.data.name : "N/A"}`,
                  value: `${i}`,
                  emoji: clipboardEmoji,
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
    }
  }
}

