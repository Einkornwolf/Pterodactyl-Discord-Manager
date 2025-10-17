/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { BaseInteraction, Client } = require("discord.js")
const { PanelManager } = require("../classes/panelManager")
const { BoosterManager } = require("./../classes/boosterManager")
const { CacheManager } = require("./../classes/cacheManager")
const { EconomyManager } = require("./../classes/economyManager")
const { LogManager } = require("./../classes/logManager")
const { DataBaseInterface } = require("./../classes/dataBaseInterface")
const { TranslationManager } = require("./../classes/translationManager")
const { GiftCodeManager } = require("./../classes/giftCodeManager")
const { EmojiManager } = require("./../classes/emojiManager")

const database = new DataBaseInterface()
const boosterManager = new BoosterManager()
const cacheManager = new CacheManager()
const economyManager = new EconomyManager()
const logManager = new LogManager()
const giftCodeManager = new GiftCodeManager()
const emojiManager = new EmojiManager();
const panel = new PanelManager(process.env.PTERODACTYL_API_URL, process.env.PTERODACTYL_API_KEY, process.env.PTERODACTYL_ACCOUNT_API_KEY)
const dotenv = require("dotenv");
dotenv.config({
    path: "./../config.env",
});


module.exports = {
    name: "interactionCreate",
    once: false,

    /**
     * 
     * @param {BaseInteraction} interaction 
     * @param {Client} client
     */
    async execute(interaction, client) {
        // Hier mit Fehlermeldung antworten, wenn du das möchtest
        if (!interaction.inGuild()) return;
        let translationManager = new TranslationManager(interaction.user.id)
        const t = async function (key) {
            return await translationManager.getTranslation(key)
        }

        // Interaction is Command
        if (interaction.isCommand()) {
            let command = client.commands.get(interaction.commandName);
            try {
                await command.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, database, t, giftCodeManager, emojiManager);
            } catch (error) {
                console.error(`Command "${command.customId}" failed: ${error}`)
            }

            // Interaction is Button
        } else if (interaction.isButton()) {
            //Exclude Blackjack Buttons 
            if (["discord-blackjack-hitbtn", "discord-blackjack-splitbtn", "discord-blackjack-standbtn", "discord-blackjack-ddownbtn", "discord-blackjack-cancelbtn", "pdm-bj-hit", "pdm-bj-split", "pdm-bj-stand", "pdm-bj-double", "pdm-bj-cancel"].includes(interaction.customId)) return;
            //Exlude Trivia Buttons
            if (["A", "B", "C", "D"].includes(interaction.customId)) return;
            //Exclude Runtime Override Buttons
            if(["overrideFalse", "overrideTrue"].includes(interaction.customId)) return;

            let button = client.buttons.get(interaction.customId);
            try {
                await button.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, database, t, giftCodeManager, emojiManager);
            } catch (error) {
                console.error(`Button "${button.customId}" failed: ${error}`);
            }
        // Interaction is Select Menu
        } else if (interaction.isStringSelectMenu()) {
            //Exclude GiftCode Select Menu
            if (["singleUseCodeSelect"].includes(interaction.customId)) return;
            let selectMenu = client.selectMenus.get(interaction.customId);
            try {
                await selectMenu.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, database, t, giftCodeManager, emojiManager);
            } catch (error) {
                console.log(`Select Menu "${selectMenu.customId}" failed: ${error}`);
            }
            // Interaction is Modal
        } else if (interaction.isModalSubmit()) {
            let modal = client.modals.get(interaction.customId);
            try {
            await modal.execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, database, t, giftCodeManager, emojiManager);
            } catch(error) {
                console.log(`Modal "${modal.customId}" failed: ${error}`)
            }
        }
    }
}
