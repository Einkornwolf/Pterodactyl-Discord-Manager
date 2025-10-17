/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");
const { TranslationManager } = require("../../classes/translationManager")
const { PanelManager } = require("../../classes/panelManager")
const { BoosterManager } = require("../../classes/boosterManager")
const { CacheManager } = require("../../classes/cacheManager")
const { EconomyManager } = require("../../classes/economyManager")
const { LogManager } = require("../../classes/logManager")
const { DataBaseInterface } = require("../../classes/dataBaseInterface")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, escapeInlineCode, ComponentType, MessageFlags } = require("discord.js")
const { UtilityCollection } = require("../../classes/utilityCollection");

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("../../classes/emojiManager")


module.exports = {
    customId: "deleteCodeButton",
    /**
     * Trivia minigame
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
     * @param {GiftCodeManager} giftCodeManager
     * @param {EmojiManager} emojiManager
     */
    async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    let { user: { id: userId, tag }, user: iUser, channel } = interaction
    let fetchedUser = await iUser.fetch(true), { accentColor } = fetchedUser
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined

        let deleteCode = interaction.message.embeds[0].data.footer.text
        let deleteCodeValue = await giftCodeManager.deleteGiftCode(deleteCode)

        if(deleteCodeValue == false) {
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                    .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("giftcode_manager.code_not_found")}**`)
                    .setColor(accentColor ? accentColor : 0xe6b04d)
                    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                    .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("giftcode_manager.main_label")}`)
                .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("giftcode_manager.deleted_text")}**`)
                .setColor(accentColor ? accentColor : 0xe6b04d)
                .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                .setTimestamp()
            ],
            flags: MessageFlags.Ephemeral
        })
    }
}