/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { DataBaseInterface } = require("./../classes/dataBaseInterface");
const { BaseInteraction, Client, Message, EmbedBuilder } = require("discord.js");
const { EconomyManager } = require("./../classes/economyManager");
const countingChannel = require("../commands/countingChannel");
const { TranslationManager } = require("./../classes/translationManager")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")
const emojiManager = new EmojiManager()

const states = {
    INTEGER: "INTEGER",
    BINARY: "BINARY"
}

let currentMode = states.INTEGER;
let currentValue = 0;
let userId;
let lastUserId = 0;

//Method for picking a random Mode
let pickMode = async function(channel, t) {
  let modes = Object.keys(states);
  let modeCount = modes.length
  oldMode = currentMode;
  currentMode = states[modes[Math.floor(Math.random() * modeCount)]]
  if(oldMode == currentMode) return;

  const title = await t("counting.new_mode_title");
  const modeName = await t(`counting.mode_names.${currentMode.toLowerCase()}`);
  const descriptionTemplate = await t(`counting.mode_descriptions.${currentMode.toLowerCase()}`);
  const footer = await t("counting.new_mode_footer");

  const guild = channel.guild;
  const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;
  const logo = await emojiManager.getEmoji("emoji_logo");
  const arrow = await emojiManager.getEmoji("emoji_arrow_down_right");

  const newModeEmbed = new EmbedBuilder()
    .setTitle(`${logo} ${title}: ${modeName}`)
    .setDescription(`${arrow} ${descriptionTemplate}`)
    .setColor(0x00AE86)
    .setFooter({ text: footer, iconURL: serverIconURL })
    .setTimestamp();

  await channel.send({ embeds: [newModeEmbed] })
}

//Method for sending the Embed when a wrong Number is typed
let sendFailureEmbed = async function(givenText, channel, t) {

  let expectedValue = 0;
  switch(currentMode) {
    case states.INTEGER:
      expectedValue = currentValue + 1;
      break;
    case states.BINARY:
      expectedValue = (currentValue + 1).toString(2);
      break;
  }

  const guild = channel.guild;
  const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;
  const error = await emojiManager.getEmoji("emoji_error");
  const arrow = await emojiManager.getEmoji("emoji_arrow_down_right");

  const failEmbed = new EmbedBuilder()
    .setTitle(`${error} ${await t("counting.wrong_number_title")} ${error}`)
    .setDescription(`${arrow} > <@${userId}> ${await t("counting.wrong_number_text")}`)
    .addFields(
      { name: `${arrow} ${await t("counting.expected_label")}`, value: `\`${expectedValue}\``, inline: true },
      { name: `${arrow} ${await t("counting.given_label")}`, value: `\`${givenText}\``, inline: true }
    )
    .setColor(0xE74C3C)
    .setFooter({ text: await t("counting.wrong_number_footer"), iconURL: serverIconURL })
    .setTimestamp();

  await channel.send({ embeds: [failEmbed] })
}

//Method for sending the Embed when the same User typed two Numbers in a row
let sendUserFailureEmbed = async function(givenText, channel, t) {
  const guild = channel.guild;
  const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined;
  const error = await emojiManager.getEmoji("emoji_error");
  const arrow = await emojiManager.getEmoji("emoji_arrow_down_right");

  const failEmbed = new EmbedBuilder()
    .setTitle(`${error} ${await t("counting.wrong_user_title")} ${error}`)
    .setDescription(`${arrow} > <@${userId}> ${await t("counting.wrong_user_text")}`)
    .setColor(0xE74C3C)
    .setFooter({ text: await t("counting.wrong_number_footer"), iconURL: serverIconURL })
    .setTimestamp();

  await channel.send({ embeds: [failEmbed] })
}

module.exports = {
  customId: "countingGame",
  /**
   * Counting System
   * 
   * @param {Message} message
   * @param {Client} client
   * @param {DataBaseInterface} database
   * @param {EconomyManager} economy
   */
  async execute(message, client, database, economy) {
    let { guildId, author: { bot, id } } = message
    if (!message.inGuild()) return;
    if (bot) return;
    //Check if User has an Account
    let userData = await database.getObject(id)

    //Get Channel from Database
    let countingChannel = await database.getObject("countingChannel")

    //Create dynamic Translation Method
    let translationManager = new TranslationManager(id);
    const t = async function (key) {
        return await translationManager.getTranslation(key)
    }

    //Check if message is in the correct Channel
    if(message.channelId != countingChannel) return;

    //Diregard Users without an Account
    if (userData == null) {
      await message.react('🚹');
      await message.react('❌');
      return;
    }

    let economyManager = new EconomyManager();

    //Check if a user sent two numbers in a row
    if(id == lastUserId) {
        await sendUserFailureEmbed(message.content, message.channel, t);
        await message.react('❌');
        currentValue = 0;
        lastUserId = 0;
        await economyManager.removeCoins(id, 2);
        await pickMode(message.channel, t);
        return;
    }

    //Set Global 
    userId = id;

    switch(currentMode) {
      case states.INTEGER: 
        if(message.content == currentValue + 1) {
          currentValue++;
          await message.react('✅');
          lastUserId = id;
          await economyManager.addCoins(id, 1);
          break;
        } 

        await message.react('❌');
        await sendFailureEmbed(message.content, message.channel, t);
        currentValue = 0;
        lastUserId = 0;
        await economyManager.removeCoins(id, 2);
        await pickMode(message.channel, t);
        break;
      case states.BINARY:
        if(message.content == (currentValue + 1).toString(2)) {
          currentValue++;
          await message.react('✅');
          lastUserId = id;
          await economyManager.addCoins(id, 1);
          break;
        } 

        await message.react('❌');
        await sendFailureEmbed(message.content, message.channel, t);
        currentValue = 0;
        lastUserId = 0;
        await economyManager.removeCoins(id, 2);
        await pickMode(message.channel, t);
        break;
    }
  },
};
