/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

// Alle requires und Requierements
const dotenv = require('dotenv');
const path = require('node:path');
const axios = require('axios')
const { GlobalFonts } = require("@napi-rs/canvas");
const { join } = require('node:path');

//Initializte DotEnv
dotenv.config({
	path: './config.env'
})

const {
	GatewayIntentBits,
	Partials,
	Collection
} = require('discord.js');

const { ManagerClient } = require("./managers/manager")

const client = new ManagerClient({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
	partials: [Partials.Channel, Partials.User, Partials.GuildMember, Partials.ThreadMember]
});

const token = process.env.BOT_TOKEN

//Create Collections
client.commands = new Collection()
client.events = new Collection()
client.buttons = new Collection()
client.selectMenus = new Collection()
client.modals = new Collection()
client.analogCommands = new Collection()
client.cronJobs = new Collection()

//Load Events // Client Event Handler
client.loadEvents()
//Login Bot
client.login(token);

