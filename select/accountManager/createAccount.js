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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js")
const { CanvasPreset } = require("../../classes/canvasPresets")
const dotenv = require("dotenv");
dotenv.config({
    path: "./config.env",
});
const { EmojiManager } = require("../../classes/emojiManager")

module.exports = {
    customId: "createAccount",
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
        let { user: { id, tag }, user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser, userData = await databaseInterface.getObject(id)
    
        const guild = interaction.guild;
        const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined

        const accountCreationModal = new ModalBuilder()
            .setCustomId("creationModal")
            .setTitle(`${await t("account_manager_modal.main_label")}`);
       
        const user_e_mail = new TextInputBuilder()
            .setCustomId("usereMail")
            .setLabel(`${await t("account_manager_modal.email_label")}`)
            .setStyle(TextInputStyle.Short);

        const user_name = new TextInputBuilder()
            .setCustomId("userName")
            .setLabel(`${await t("account_manager_modal.name_label")}`)
            .setStyle(TextInputStyle.Short);

        //Add Actionrows to Modal
        accountCreationModal.addComponents([new ActionRowBuilder().addComponents(user_e_mail), new ActionRowBuilder().addComponents(user_name)]);
        //Database Check if User exists
        //Check if user already has an account
        if (userData) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("account_manager_modal.already_has_account_text")}**`)
                        .setColor(accentColor ? accentColor : 0xe6b04d)
                        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral,
            });
            //Logging
            await logManager.logString(`${tag} tried to create an account but already had one.`)
            return;
        }
        //show modal
        await interaction.showModal(accountCreationModal);

    }
}