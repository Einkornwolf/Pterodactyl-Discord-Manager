/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { DataBaseInterface } = require("./../classes/dataBaseInterface");
const { BaseInteraction, Client, Message } = require("discord.js");
const { EconomyManager } = require("./../classes/economyManager");

module.exports = {
  customId: "currencyGiver",
  /**
   * Message event which gives 1 coin to any user with an account per message ( excluded dms )
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
    if (userData == null) return;
    //Get Message Length and calculate Bonus Coins
    let length = message.content.length
    let bonus = length > 15 ? length > 25 ? length > 35 ? length > 45 ? length > 55 ? 5 : 4 : 3 : 2 : 1 : 0;
    //Add 1 Coin to the User
    await economy.addCoins(id, 1+ bonus)
  },
};
