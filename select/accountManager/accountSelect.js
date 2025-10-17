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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")

module.exports = {
  customId: "accountSelect",
  /**
   * 
   * Account manager select menu options
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
    let { user, values } = interaction

    //User selected Create User
    if (values == "createAccount") {
      let selectOption = client.selectMenus.get("createAccount")
      await selectOption.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager)
    }


    //User selected Delete User
    if (values == "deleteAccount") {
      let selectOption = client.selectMenus.get("deleteAccount")
      await selectOption.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager)
    }


    //User selected reset Password -----------
    if (values == "resetPassword") {
      let selectOption = client.selectMenus.get("resetPassword")
      await selectOption.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager)
    }


    //User selected claim Booster Rewards
    if (values == "claimBoosterReward") {
      let selectOption = client.selectMenus.get("claimBoosterReward")
      await selectOption.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager)
    }

    //User selected Link Account
    if (values == "linkAccount") {
      let selectOption = client.selectMenus.get("linkAccount")
      await selectOption.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager)
    }
  }
}