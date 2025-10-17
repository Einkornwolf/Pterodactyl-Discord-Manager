/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");
const { TranslationManager } = require("../../../classes/translationManager")
const { PanelManager } = require("../../../classes/panelManager")
const { BoosterManager } = require("../../../classes/boosterManager")
const { CacheManager } = require("../../../classes/cacheManager")
const { EconomyManager } = require("../../../classes/economyManager")
const { LogManager } = require("../../../classes/logManager")
const { DataBaseInterface } = require("../../../classes/dataBaseInterface")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, escapeInlineCode, ComponentType, MessageFlags } = require("discord.js")
const { UtilityCollection } = require("../../../classes/utilityCollection");
const { request } = require("undici");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const { EmojiManager } = require("../../../classes/emojiManager")


module.exports = {
    customId: "triviaPlayer",

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
    async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, mode, giftCodeManager, emojiManager) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const user = interaction.user;
    const userId = user.id;
    const tag = user.tag;
    const fetchedUser = await user.fetch(true);
    const { accentColor } = fetchedUser;
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;
    const channel = interaction.channel;
    const userBalance = await economyManager.getUserBalance(userId);
    const userDaily = await economyManager.getUserDaily(userId);
 
         const einsatzEmbed = new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("minigames_events.bet_label")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("minigames_events.bet_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()


         const einsatzNoNumber = new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("minigames_events.daily_limit_reached_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
 
 
         await interaction.editReply({
             embeds: [einsatzEmbed],
             flags: MessageFlags.Ephemeral
         });
 
        //Get Messages and Filter for the Users bet
        const filter = (m) => m.author.id === userId;
        const triviaCollector = channel.createMessageCollector({
            filter,
            time: 15000,
            max: 1,
        });

        triviaCollector.on("collect", async (collected) => {
            let { content: einsatz } = collected
            einsatz = parseInt(einsatz)
            //Try to delete message
            try {
                await collected.delete();
            } catch { }
            //Check if the set User Amount is less than 0
            if (Number.isFinite(einsatz) == false || einsatz <= 0) {
                await interaction.editReply({
                    embeds: [einsatzNoNumber],
                    flags: MessageFlags.Ephemeral
                });
                //Logging
                await logManager.logString(`${tag} tried to play a minigame with insufficient coins / remaining daily limit.`)
                return;
            }

            //Win factor
            let winFactor = mode == "easy" ? 1.25 : mode == "medium" ? 1.5 : 2
            //Check if user has enough coins, reached his daily limit, or would reach his daily limit
            if (einsatz * winFactor > userBalance || userDaily >= 300 || (300 - userDaily) < (einsatz * winFactor)) {
                await interaction.editReply({
                    embeds: [einsatzNoNumber],
                    flags: MessageFlags.Ephemeral
                });
                //Logging
                await logManager.logString(`${tag} tried to play a minigame with insufficient coins / remaining daily limit.`)
                return;
            }

            //Get Questions
            let { body } = await request(`https://the-trivia-api.com/api/questions?limit=1&difficulty=${mode}`), apiData = await body.json()

            if (!apiData) return
            let { category, tags, question, type, id, difficulty, incorrectAnswers, correctAnswer } = apiData[0]

            let questionEmbed = new EmbedBuilder()
                .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("minigames_events.difficulty_label")}`)
                .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("trivia.description_text")}`)
                .addFields(
                    {
                        name: `${await t("trivia.category_text")}`,
                        value: `\`\`\`${category}\`\`\``,
                        inline: true
                    },
                    {
                        name: `${await t("trivia.difficulty_text")}`,
                        value: `\`\`\`${difficulty}\`\`\``,
                        inline: true
                    },
                    {
                        name: `${await t("trivia.tags_text")}`,
                        value: `\`\`\`${tags}\`\`\``,
                        inline: true
                    },
                    {
                        name: `${await t("trivia.question_text")}`,
                        value: `\`\`\`${question}\`\`\``,
                        inline: false
                    },
                )
                .setColor(accentColor ? accentColor : 0xe6b04d)
                .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                .setTimestamp()


            //Randomize Answer
            let answerList = [...incorrectAnswers, correctAnswer]
            let shuffleList = async (array) => {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array
            }
            let shuffledList = await shuffleList([...answerList]), [a1, a2, a3, a4] = shuffledList

            let answers = `\n >>> 🅰️: \`${a1}\`\n\n🅱️: \`${a2}\`\n\n:regional_indicator_c:: \`${a3}\`\n\n:regional_indicator_d:: \`${a4}\``
            questionEmbed.addFields({
                name: `${await t("trivia.choice_text")}\n`,
                value: `${answers}`,
                inline: false
            })

            let buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setStyle("Success")
                    .setEmoji("🅰️")
                    .setCustomId("A"),

                new ButtonBuilder()
                    .setStyle("Success")
                    .setEmoji("🅱️")
                    .setCustomId("B"),

                new ButtonBuilder()
                    .setStyle("Success")
                    .setEmoji("🇨")
                    .setCustomId("C"),

                new ButtonBuilder()
                    .setStyle("Success")
                    .setEmoji("🇩")
                    .setCustomId("D"),

            )

            await interaction.editReply({
                embeds: [questionEmbed],
                components: [buttonRow],
                flags: MessageFlags.Ephemeral
            })

            const answerFilter = i => {
                return i.user.id === userId
            }

            const answerCollector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000, max: 1, filter: answerFilter });

            answerCollector.on('collect', async answerButton => {
                try {
                await answerButton.deferReply({ flags: MessageFlags.Ephemeral })
                } catch {}
                let { customId } = answerButton
                let answerObject = {
                    A: 0, B: 1, C: 2, D: 3
                }, userAnswer = answerObject[customId]
                if (shuffledList[userAnswer] !== correctAnswer) {
                    await economyManager.removeCoins(userId, einsatz) // Hier einsatz * (winFactor - 1) zusätzlich
                    //User has selected the wrong answer
                    const correctIndex = shuffledList.indexOf(correctAnswer);
                    const optionEmojis = ["🅰️", "🅱️", "🇨", "🇩"];
                    const correctOptionEmoji = optionEmojis[correctIndex];
                    await answerButton.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("minigames_events.difficulty_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                                .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} ${await t("minigames_events.blackjack_loose_text")} ${einsatz} ${await t("minigames_events.blackjack_loose_text_two")} 0 Coins!`) // Hier ${(winFactor - 1) * einsatz}
                                .setColor(accentColor ? accentColor : 0xe6b04d)
                                .addFields({ name: `${await t("trivia.right_text")} ${correctOptionEmoji}`, value: `\`\`\`${correctAnswer}\`\`\``, inline: false })
                            ],
                            components: [],
                            flags: MessageFlags.Ephemeral
                        })
                        return;
                    }
                    //User won
                    await economyManager.addCoins(userId, (winFactor - 1) * einsatz)
                    await economyManager.addDailyAmount(userId, einsatz * winFactor)
                    let userDaily = await economyManager.getUserDaily(userId)
                    await answerButton.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`${await emojiManager.getEmoji("emoji_logo")} ${await t("minigames_events.difficulty_label")}`)
                                .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("minigames_events.blackjack_won_text_two")}** \`${einsatz * winFactor}\` **${await t("minigames_events.blackjack_win_text_three")}** \`${userDaily ? userDaily : 0}\` **${await t("minigames_events.blackjack_win_text_four")}**`)
                                .setColor(accentColor ? accentColor : 0xe6b04d)
                        ],
                        components: [],
                        flags: MessageFlags.Ephemeral
                    })
            });

            answerCollector.on("end", async answerButton => {
                if(answerButton.size == 1) return
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.error_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("trivia.expired")}**`)
                            .setColor(accentColor ? accentColor : 0xe6b04d)
                    ],
                    components: [],
                    flags: MessageFlags.Ephemeral
                })
            });
            })



        }
    }
