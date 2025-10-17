// ==================== nl-NL.js ====================
const { SlashCommandBuilder } = require("@discordjs/builders");
const { TranslationManager } = require("../../classes/translationManager")
const { PanelManager } = require("../../classes/panelManager")
const { BoosterManager } = require("../../classes/boosterManager")
const { CacheManager } = require("../../classes/cacheManager")
const { EconomyManager } = require("../../classes/economyManager")
const { LogManager } = require("../../classes/logManager")
const { DataBaseInterface } = require("../../classes/dataBaseInterface")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, MessageFlags } = require("discord.js")
const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});
const { EmojiManager } = require("../../classes/emojiManager")
module.exports = {
  customId: "nl",
  /**
   * Set users language to "nl-NL"
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
   */
  async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let { user: { id }, user } = interaction;
    let fetchedUser = await user.fetch(true), { accentColor } = fetchedUser;
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;
    //Set User Language to Selected Option
    let translate = new TranslationManager(id), langShort = "nl-NL";
    await translate.saveUserLanguage(langShort);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
        .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("language_event.main_label")}`)
        .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("language_event.change_language_text")}** \`${langShort}\``)
        .setColor(accentColor ? accentColor : 0xe6b04d)
        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
        .setTimestamp()
      ],
      flags: MessageFlags.Ephemeral,
    });
   },
};