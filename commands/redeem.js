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
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

// Redeem Command
module.exports = {
    data: new SlashCommandBuilder()
        .setName("redeem")
        .setDescription("Redeem codes and collect Coins!")
        .addStringOption((option) =>
            option.setRequired(true).setName("code").setDescription("Gift-Code")
        ),
    /**
     * Redeem Command
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
     * @returns 
     */
    async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        let { user: { id: userId, tag }, user: user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
        const guild = interaction.guild;
        const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
        let userData = await databaseInterface.getObject(userId), utility = new UtilityCollection(), code = interaction.options.getString("code")

        //Check if User has an Account
        if (userData == null) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.no_account_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("coins.no_account_text")}**`)
                        .setColor(accentColor ? accentColor : 0xe6b04d)
                        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            })
            await logManager.logString(`${tag} tried to use /redeem without an Account`)
            return
        }

        //Check if Code is valid
        let codeList = await databaseInterface.getObject("gift_codes_list")
        if (codeList.some((element) => element.code == code) == false) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("giftcode_manager.non_existing_code")}**`)
                        .setColor(accentColor ? accentColor : 0xe6b04d)
                        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            })
            await logManager.logString(`${tag} tried to use the not existing code ${code}`)
            return
        }

        //Add Coins to User and Check if Code is Single Use only
        let obj = codeList.find((obj) => obj.code == code)
        let index = codeList.indexOf(obj)
        if (codeList[index].singleUse == "true") {
            await economyManager.addCoins(userId, parseInt(codeList[index].value))
            await logManager.logString(`Code ${code} has been redeemed by ${user.tag} for ${codeList[index].value} Coins.`)
            await giftCodeManager.deleteGiftCode(code)
            await interaction.editReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("giftcode_manager.success_label")}`)
                        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("giftcode_manager.success_text")} **${codeList[index].value}** Coins!`)
                        .setColor(accentColor ? accentColor : 0xe6b04d)
                        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                        .setTimestamp()
                ]
            })
            return;
        }
        //If Code is single use only, remove it, if not, forbid the user to redeem this code again
        //Check if usedBy contains User
        if (codeList[index].usedBy.includes(userId)) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("giftcode_manager.already_used_code_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("giftcode_manager.already_used_code")}**`)
                        .setColor(accentColor ? accentColor : 0xe6b04d)
                        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        await economyManager.addCoins(userId, parseInt(codeList[index].value))
        await logManager.logString(`Code ${code} has been redeemed by ${user.tag} for ${codeList[index].value} Coins.`)
        await giftCodeManager.addUsed(userId, code)
        await interaction.editReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${await emojiManager.getEmoji("emoji_logo")}  ${await t("giftcode_manager.success_label")}`)
                    .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("giftcode_manager.success_text")} **${codeList[index].value}** Coins!`)
                    .setColor(accentColor ? accentColor : 0xe6b04d)
                    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                    .setTimestamp()
            ]
        })

    }
}