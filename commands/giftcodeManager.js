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
const { BaseInteraction, Client, StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, SelectMenuOptionBuilder, MessageFlags } = require("discord.js")
const dotenv = require("dotenv");
dotenv.config({
    path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")


module.exports = {
    data: new SlashCommandBuilder()
        .setName("giftcode-manager")
        .setDescription("Create or delete Gift-Codes"),
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
    * @param {GiftCodeManager} giftCodeManager
    * @param {EmojiManager} emojiManager
    * @returns 
    */
    async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        let { user: { id: userId, tag }, user: user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
        const guild = interaction.guild;
        const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
        let userData = await databaseInterface.getObject(userId)

        let giftCodes = await databaseInterface.getObject("gift_codes_list")
        if (giftCodes == null) giftCodes = []

        //Check if User is an Admin
        if (!process.env.ADMIN_LIST.includes(userId)) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.no_admin_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("errors.no_admin_text")}**`)
                        .setColor(accentColor ? accentColor : 0xe6b04d)
                        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral,
            });
            //Logging
            await logManager.logString(`${tag} tried to use /giftcode-manager without admin permissions`)
            return;
        }


        let giftCodesEmbed = new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("giftcode_manager.main_label")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("giftcode_manager.main_text")}** \`${giftCodes ? giftCodes.length : 0}\` **${await t("giftcode_manager.main_text_two")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()

        let giftCodesMenu = new StringSelectMenuBuilder().setCustomId("giftCodeSelect")

        const plusEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_arrow_down_right"));
        const giftEmoji = emojiManager.parseEmoji(await emojiManager.getEmoji("emoji_gift"));

        giftCodesMenu.addOptions([
            {
                label: `${await t("giftcode_manageradd_item_label")}`,
                description: `${await t("giftcode_manageradd_item_text")}`,
                value: `addCode`,
                emoji: plusEmoji,
            }
        ])

        //Add Embed and Select Fields
        for (let i = 0; i < 24 && i < giftCodes.length; i++) {
            giftCodesEmbed.addFields([
                {
                    name: `${await emojiManager.getEmoji("emoji_gift")} #${i}: ${giftCodes[i].code}`,
                    value: `Code:\`\`\`js\n${giftCodes[i].code}\`\`\`Value: \`\`\`js\n${giftCodes[i].value} Coins\`\`\``,
                    inline: true,
                }
            ])

            giftCodesMenu.addOptions([
                {
                    label: `#${i}: ${giftCodes[i].code}`,
                    description: `${giftCodes[i].code}`,
                    value: `${i}`,
                    emoji: giftEmoji,
                }
            ])
        }

        let row = new ActionRowBuilder().addComponents(giftCodesMenu)

        await interaction.editReply({
            embeds: [giftCodesEmbed],
            components: [row],
            flags: MessageFlags.Ephemeral
        })
    }
}