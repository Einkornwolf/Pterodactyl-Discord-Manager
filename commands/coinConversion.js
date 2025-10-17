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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coin-conversion")
    .setDescription("Outputs the complete amount of coins in conversion"),
  /**
  * Show user how many coins are in total conversion
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
    let { user: { id: userId, tag }, user: user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
        .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("coins.umlauf.coin_label")}`)
        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} \`${await economyManager.getTotalCoinAmount()}\` **${await t("coins.umlauf.coin_text")}**`)
        .setColor(accentColor ? accentColor : 0xe6b04d)
        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
        .setTimestamp()
      ],
      flags: MessageFlags.Ephemeral,
    });
    //Logging
    await logManager.logString(`${tag} checked the Coins in rotation: ${await economyManager.getTotalCoinAmount()} Coins`)
  },
};
