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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SelectMenuOptionBuilder, MessageFlags } = require("discord.js")
const dotenv = require("dotenv");
dotenv.config({
    path: "./config.env",
});

module.exports = {
    customId: "addCodeItem",
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
        let { user: { id, tag }, user, values } = interaction, giftCodes = await databaseInterface.getObject("gift_codes_list"), fetchedUser = await user.fetch(true), { accentColor } = fetchedUser

        const guild = interaction.guild;
        const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined

        //Check if there are more than 24 gift codes currently created
        if (!giftCodes) giftCodes = 0
        switch (giftCodes.length >= 24) {
            //More than 24 Items
            case true: {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral })
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("giftcode_manager.twentyfour_limit_text")}**`)
                            .setColor(accentColor ? accentColor : 0xe6b04d)
                            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                            .setTimestamp()
                    ],
                    flags: MessageFlags.Ephemeral
                })
                //Logging
                await logManager.logString(`${tag} tried to add more than 24 Gift Codes.`)
                break;
            }
            //Less than 24 Items
            case false: {
                //Create Modal
                //Create and show modal
                let itemModal = new ModalBuilder()
                    .setCustomId("addCodeItemModal")
                    .setTitle(`${await t("giftcode_manager.main_label")}`)

                let itemCode = new TextInputBuilder()
                    .setValue("abcde")
                    .setCustomId("itemCode")
                    .setLabel(`${await t("giftcode_manager.modal_code")}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                let itemValue = new TextInputBuilder()
                    .setValue("0")
                    .setCustomId("itemValue")
                    .setLabel(`${await t("giftcode_manager.modal_value")}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                itemModal.addComponents([
                    new ActionRowBuilder().addComponents([itemCode]),
                    new ActionRowBuilder().addComponents([itemValue]),
                ])

                await interaction.showModal(itemModal)
                return;
            }
        }

        //
    }
}