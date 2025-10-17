/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const Discord = require("discord.js");
const { EconomyManager } = require("../classes/economyManager");
const { PanelManager } = require("../classes/panelManager");
const { DataBaseInterface } = require("../classes/dataBaseInterface")
const { EmojiManager } = require("../classes/emojiManager")
const fs = require("fs")
const dotenv = require("dotenv");
dotenv.config({
  path: "./../config.env",
});

const database = new DataBaseInterface()
const panel = new PanelManager(process.env.PTERODACTYL_API_URL, process.env.PTERODACTYL_API_KEY, process.env.PTERODACTYL_ACCOUNT_API_KEY)
const emojiManager = new EmojiManager();

module.exports = {
  name: "clientReady",
  once: false,
  /**
   *
   * @param {Discord.Client} client
   */
  async execute(client) {
    //Execute Client Command Loader
    await client.loadCommands();
    await client.loadButtons();
    await client.loadSelectMenus();
    await client.loadModals();
    await client.loadAnalogCommands();
    await client.loadCronJobs();

    //Start Cronjobs
    //Reset Job
    let cronJob = client.cronJobs.get("dailyReset");
    await cronJob.execute(client, new EconomyManager());

    //Runtime Job
    cronJob = client.cronJobs.get("dailyRuntime");
    await cronJob.execute(client, panel, database, emojiManager);

    //Start express server
    let dashboard = require("../express/server.js")
    await dashboard.execute(client, new EconomyManager(), panel)
  },
};
