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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, MessageFlags, Embed } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
    path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-counting-channel")
        .setDescription("Sets the Channel the Counting-Game should be tracked in")
        .addChannelOption((channelOption) =>
            channelOption.setName("channel").setDescription("Channel the Game should be tracked in").setRequired(true)
        ),
    /**
     * Counting-Game Management Command
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
        //Reply to User
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        let { user: { id: userId, tag }, user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
        const guild = interaction.guild;
        const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
        let channel = interaction.options.getChannel("channel")

        if (!channel.isTextBased()) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("counting.incorrect_channel")} ${await emojiManager.getEmoji("emoji_error")}`)
                        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("counting.incorrect_channel_text")}**`)
                        .setColor(accentColor ? accentColor : 0xe6b04d)
                        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            });
            await logManager.logString(`${tag} tried to set a Counting-Game Channel which is not text-based`)
            return;
        }

        databaseInterface.setObject("countingChannel", channel.id)

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("counting.counting_channel")}`)
                    .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("counting.counting_channel_set")} <#${channel.id}>`)
                    .setColor(accentColor ? accentColor : 0xe6b04d)
                    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                    .setTimestamp()
            ],
            flags: MessageFlags.Ephemeral
        });

        const start_embed = new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("counting.counting_channel_start")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("counting.counting_channel_start_text")}`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()


        await channel.send({ embeds: [start_embed] })

        const start_embed_int = new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("counting.counting_channel_start_int")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("counting.counting_channel_start_int_text")}`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()


        await channel.send({ embeds: [start_embed_int] })


        await logManager.logString("Channel for the Counting System has been set to " + channel.name + " with ID: " + channel.id + " by " + user.globalName + " with ID: " + user.id)
    },
};
