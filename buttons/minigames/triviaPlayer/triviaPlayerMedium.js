/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");
const { TranslationManager } = require("../../../classes/translationManager")
const { PanelManager } = require("../../../classes/panelManager")
const { BoosterManager } = require("../../../classes/boosterManager")
const { CacheManager } = require("../../../classes/cacheManager")
const { EconomyManager } = require("../../../classes/economyManager")
const { LogManager } = require("../../../classes/logManager")
const { DataBaseInterface } = require("../../../classes/dataBaseInterface")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, escapeInlineCode } = require("discord.js")
const { UtilityCollection } = require("../../../classes/utilityCollection");
const { EmojiManager } = require("../../../classes/emojiManager")

module.exports = {
    customId: "triviaPlayerMedium",

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
     */
    async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
        //Start Medium Game
        let trivia = require("./triviaPlayer")
        await trivia.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, "medium", giftCodeManager, emojiManager)
    }
}