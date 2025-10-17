/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { UtilityCollection } = require("../../classes/utilityCollection")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js")
const utility = new UtilityCollection()

module.exports = {
  customId: "eval",
  /**
   * Developer command for evaluation of javascript
   * 
   * @param {Message} message
   * @param {Client} client
   */
  async execute(message, client) {
    switch (process.env.ADMIN_LIST && process.env.ADMIN_LIST.includes(message.author.id)) {
      case false:
        return;
      case true:
        break;
    }
    let { content } = message, evalData = content.slice(11), timeBefore = performance.now();

    try {
      let result = await eval(evalData), timeAfter = performance.now()

      const resultEmbed = new EmbedBuilder()
        .setColor("#8f82ff")
        .setTitle(`Success. Executed in: ${await utility.roundUp((timeAfter - timeBefore), 2000)} ms`)
        .addFields(
          {
            name: `Input:\n`,
            value: `\`\`\`js\n${evalData}\`\`\``,
            inline: false,
          },
          {
            name: `Output:\n`,
            value: `\`\`\`js\n${result}\`\`\``,
            inline: true,
          },
          {
            name: `Output-Type:\n`,
            value: `\`\`\`js\n${typeof(result)}\`\`\``,
            inline: true,
          }
        );

      message.channel.send({ embeds: [resultEmbed] });
    } catch (error) {
      const resultEmbed = new EmbedBuilder()
        .setColor("#8f82ff")
        .setTitle("Error")
        .addFields(
          {
            name: `Input:\n`,
            value: `\`\`\`js\n${evalData}\`\`\``,
            inline: false,
          },
          {
            name: `Output:\n`,
            value: `\`\`\`js\n${error}\`\`\``,
            inline: true,
          }
        );

      message.channel.send({ embeds: [resultEmbed] });
    }
  },
};
