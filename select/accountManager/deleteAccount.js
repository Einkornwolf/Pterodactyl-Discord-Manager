/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { PanelManager } = require("../../classes/panelManager")
const { TranslationManager } = require("./../../classes/translationManager")
const { BoosterManager } = require("./../../classes/boosterManager")
const { CacheManager } = require("../../classes/cacheManager")
const { EconomyManager } = require("./../../classes/economyManager")
const { LogManager } = require("./../../classes/logManager")
const { DataBaseInterface } = require("./../../classes/dataBaseInterface")
const { UtilityCollection } = require("./../../classes/utilityCollection")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
    path: "./config.env",
});

const { EmojiManager } = require("../../classes/emojiManager")

module.exports = {
    customId: "deleteAccount",
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
        let { user: { id, tag }, user, channel } = interaction;
        let fetchedUser = await user.fetch(true);
        let { accentColor } = fetchedUser;
        let userData = await databaseInterface.getObject(id);

        const guild = interaction.guild;
        const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (!userData) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("account_manager_modal.deletion_no_account_text")}**`)
                        .setColor(accentColor ? accentColor : 0xe6b04d)
                        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral,
            });
            await logManager.logString(`${tag} tried to delete his account but failed due to him not having an account.`)
            return;
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${await emojiManager.getEmoji("emoji_warning")} ${await t("account_manager.deletion_label")} ${await emojiManager.getEmoji("emoji_warning")}`)
                    .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("account_manager.deletion_text")}**`)
                    .setColor(accentColor ? accentColor : 0xe6b04d)
                    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                    .setTimestamp()
            ],
            flags: MessageFlags.Ephemeral,
        });

        const filter = (m) => m.author.id === id;
        const collector = channel.createMessageCollector({
            filter,
            time: 15000,
            max: 1,
        });

        collector.on("collect", async (collected) => {
            let { content } = collected, { e_mail } = userData
            try {
                await collected.delete();
            } catch (e) { console.log("Could not delete message") }
            if (content !== "delete") {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("account_manager.deletion_fail_text")}**`)
                            .setColor(accentColor ? accentColor : 0xe6b04d)
                            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                            .setTimestamp()
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            await panel.deleteAllServers(e_mail)
            await databaseInterface.deleteUser(id)
            await panel.removeUser(e_mail)

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${await emojiManager.getEmoji("emoji_logo")}⠀${await t("account_manager_modal.deletion_success_label")}`)
                        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("account_manager_modal.deletion_success_text")}**`)
                        .setColor(accentColor ? accentColor : 0xe6b04d)
                        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral,
            });
            await logManager.logString(`${tag} deleted his account.`);
            return;
        });
    }
}