/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { Client } = require("discord.js");
const { EconomyManager } = require("../classes/economyManager");
const { LogManager } = require("../classes/logManager");
const logManager = new LogManager()
var CronJob = require('cron').CronJob;

module.exports = {
  customId: "dailyReset",
  /**
   * 
   * Resets all daily max minigames win amounts at a given cron time
   *
   * @param {Client} client
   * @param {EconomyManager} economy
   */
  async execute(client, economy) {
    //Every Day at midnight
    var job = new CronJob(
      "0 0 0 * * *",
      async function () {
        //Reset Daily User Rewards
        await economy.resetAllDailyAmounts()
        await logManager.logString("The daily rewards of all users have been reset at midnight")
      },
      null,
      true,
      "Europe/Amsterdam"
    );
    //Start Cronjob
    job.start();
  },
};
