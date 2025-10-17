/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { UtilityCollection } = require("../../classes/utilityCollection")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js")
const utility = new UtilityCollection()

module.exports = {
  customId: "reload",
  /**
   * Developer command for reloading the bots components
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

    let { content } = message, subCommand = content.split("? ")[1], timeBefore = performance.now()

    //Reload
    switch (subCommand) {
      case "events":
        {
          await client.reloadEvents();
          let timeAfter = performance.now();
          message.channel.send(`Reloaded Events in ${await utility.roundUp(timeAfter - timeBefore,5)} milliseconds`);
        }
        break;

      case "commands":
        {
          await client.reloadCommands();
          let timeAfter = performance.now();
          message.channel.send(`Reloaded Commands in ${await utility.roundUp(timeAfter - timeBefore,5)} milliseconds`);
        }
        break;

      case "all": {
        await client.reloadEvents();
        await client.reloadCommands();
        await client.reloadButtons();
        await client.reloadSelectMenus();
        await client.reloadModals();
        await client.reloadAnalogCommands();
        let timeAfter = performance.now();
        message.channel.send(`Reloaded Commands, Events, Buttons, Select Menus, Modals and Analog Commands in ${await utility.roundUp(timeAfter - timeBefore,5)} milliseconds`);
      }
    }
  },
};
