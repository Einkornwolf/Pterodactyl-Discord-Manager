/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { PanelManager } = require("../../classes/panelManager")
const { TranslationManager } = require("../../classes/translationManager")
const { BoosterManager } = require("../../classes/boosterManager")
const { CacheManager } = require("../../classes/cacheManager")
const { EconomyManager } = require("../../classes/economyManager")
const { LogManager } = require("../../classes/logManager")
const { DataBaseInterface } = require("../../classes/dataBaseInterface")
const { UtilityCollection } = require("../../classes/utilityCollection")
const { EmojiManager } = require("../../classes/emojiManager")
const dotenv = require('dotenv');
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js")

module.exports = {
  customId: "selectShopItem",
  /**
   * Select-Menu for adding items to the shop
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
    let { user: { id, tag }, user, values } = interaction, shopItems = await databaseInterface.getObject("shop_items_servers"), fetchedUser = await user.fetch(true), { accentColor } = fetchedUser

    const guild = interaction.guild;
    const serverIconURL = guild.iconURL({ dynamic: true });
    //Add item to shop
    if (interaction.values == "addShopItem") {
      let selectOption = client.selectMenus.get("addShopItem")
      await selectOption.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t)
      return
    }

    dotenv.config({
      path: './config.env'
    })

    //Show shop item info
    //Check if shop item still exists
    if (!shopItems[values] || !shopItems[values].data) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral })
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("shop_manager_delete.main_label")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("shop_manager_select.item_not_found_text")}**`)
            .setTimestamp()
            .setFooter({
              text: process.env.FOOTER_TEXT,
              iconURL: serverIconURL
            })
            .setColor(accentColor ? accentColor : 0xe6b04d)
        ],
        flags: MessageFlags.Ephemeral
      })
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    //Get Data about the shop item
    let nestData = await panel.getNestData(), selectedItem = shopItems[values].data, { name, description, price, server_databases, server_cpu, server_ram, server_disk, server_swap, server_backups, egg_id } = selectedItem

    //Get Nest ID
    let selectedNest = nestData.find(nest => nest.attributes.relationships.eggs.data.some(egg => egg.attributes.id == egg_id)), { attributes: { id: nestId } } = selectedNest

    //Get Egg Data
    let eggData = await panel.getEggData(egg_id, nestId), { attributes: { docker_image, startup, relationships: { variables: { data } } } } = eggData
    //Get Enviroment Variables
    let enviromentVariables = data, finalEnvList = new Object()

    let requiredEnvVariables = enviromentVariables.filter(variable => variable.attributes.rules.includes("required"))

    for (let variable of requiredEnvVariables) {
      let { attributes: { env_variable, default_value } } = variable
      finalEnvList[env_variable] = default_value
    }

    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${name}`)
        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("shop.description_label")}\n\`\`\`${description}\`\`\``)
        .setColor(accentColor ? accentColor : 0xe6b04d)
        .addFields(
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("shop_manager_select.item_number_text")}`, value: `\`\`\`${values}\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("shop.price_label")}`, value: `\`\`\`js\n${price} Coins\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.egg")}`, value: `\`\`\`js\n${egg_id}\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.image")}`, value: `\`\`\`js\n${docker_image}\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.startup")}`, value: `\`\`\`js\n${startup}\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("shop_manager_select.enviro_text")}`, value: `\`\`\`js\n${JSON.stringify(finalEnvList)}\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("shop_manager_select.database_text")}`, value: `\`\`\`js\n${server_databases}\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.cpu")}`, value: `\`\`\`js\n${server_cpu} %\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.ram")}`, value: `\`\`\`js\n${server_ram} MB\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.disk")}`, value: `\`\`\`js\n${server_disk} MB\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("serverinfo.swap")}`, value: `\`\`\`js\n${server_swap} MB\`\`\``, inline: true },
          { name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("shop_manager_select.backup_text")}`, value: `\`\`\`js\n${server_backups}\`\`\``, inline: true }
        )
        .setTimestamp()
        .setFooter({
          text: process.env.FOOTER_TEXT,
          iconURL: serverIconURL
        })],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(`${await t("shop_manager_select.delete_button_label")} #${values}`)
          .setCustomId("deleteShopItem")
          .setStyle("Danger")
      )],
      flags: MessageFlags.Ephemeral
    })
  }
}
