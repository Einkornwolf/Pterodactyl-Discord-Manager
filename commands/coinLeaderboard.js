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
    .setName("coin-leaderboard")
    .setDescription("Leaderboard of all Users"),
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
    let { user: { id: userId, tag }, user: iUser } = interaction, fetchedUser = await iUser.fetch(true), { accentColor } = fetchedUser

    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined

    //Get all active Users
    let userList = await economyManager.getTopUsers()
    console.log(userList.length)
    await userList.splice(0, userList.length - 16)
    
    let leaderEmbed = new EmbedBuilder()
    .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("leaderboard.label")}`)
    .setColor(accentColor ? accentColor : 0xe6b04d)
    .setDescription(`\`\`\`${await t("leaderboard.text")}\`\`\``)
    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
    .setTimestamp()


    for(let i = userList.length - 1; i >= 0; i--) {
        //Get User Data
        leaderEmbed.addFields([
            {
              name: `\u200b`,
              value: `${await emojiManager.getEmoji("emoji_arrow_down_right")} **#${Math.abs(i - userList.length)}:** __*<@${userList[i] ? userList[i].id : userList[i] ? userList[i].id : await t("leaderboard.free")}>*__\n${await emojiManager.getEmoji("emoji_creditcard")} **${userList[i].value.balance} Coins**`,
              inline: false,
            }
          ])
    }

  await interaction.editReply({
    embeds: [leaderEmbed],
    flags: MessageFlags.Ephemeral
  })

  }
}