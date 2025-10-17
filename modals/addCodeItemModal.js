/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { PanelManager } = require("./../classes/panelManager")
const { TranslationManager } = require("./../classes/translationManager")
const { BoosterManager } = require("./../classes/boosterManager")
const { CacheManager } = require("./../classes/cacheManager")
const { EconomyManager } = require("./../classes/economyManager")
const { LogManager } = require("./../classes/logManager")
const { DataBaseInterface } = require("./../classes/dataBaseInterface")
const { UtilityCollection } = require("./../classes/utilityCollection")
const { GiftCodeManager } = require("./../classes/giftCodeManager")
const { BaseInteraction, Client, StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SelectMenuOptionBuilder, ComponentType, SelectMenuComponent, SelectMenuInteraction, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
    path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
    customId: "addCodeItemModal",
    /**
     * Create a shop item
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
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        let { fields, user: { tag, id }, user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
        const guild = interaction.guild;
        const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
        let itemCode = fields.getTextInputValue("itemCode"), itemValue = fields.getTextInputValue("itemValue")

        const confirmEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_confirm")) || "✅";
        const denyEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_deny")) || "❌";

        //Check if Code should be Single use
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${await emojiManager.getEmoji("emoji_glass")} ${await t("giftcode_manager.single_use_label")}`)
                    .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("giftcode_manager.single_use_text")}**`)
                    .setColor(accentColor ? accentColor : 0xe6b04d)
                    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                    .setTimestamp()
            ],
            flags: MessageFlags.Ephemeral,
            components: [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("singleUseCodeSelect")
                        .addOptions(
                            {
                                label: 'Yes',
                                description: 'Single',
                                value: 'true',
                                emoji: confirmEmoji,
                            },
                            {
                                label: 'No',
                                description: 'Multi',
                                value: 'false',
                                emoji: denyEmoji
                            }
                        )
                )
            ]
        })

        let filter = i => {
            let { user: { id: userId } } = i
            return userId === id
        }

        let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 15000, max: 1, filter });

        let codeCreatedEmbed = new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("giftcode_manager.created_label")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("giftcode_manager.created_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()

        collector.on("collect", async i => {
            let singleUser = i.values[0]
            //Add Code
            await giftCodeManager.createGiftCode(itemCode, itemValue, singleUser)

            await logManager.logString(`Giftcode: ${itemCode} with Value of: ${itemValue} and Type of ${singleUser} has been created by ${user.tag}`)

            await i.deferReply({ flags: MessageFlags.Ephemeral })
            await i.editReply({
                embeds: [codeCreatedEmbed],
                flags: MessageFlags.Ephemeral,
                components: []
            })
        })
    }
}