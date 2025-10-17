/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const {Client, Attachment, AttachmentBuilder} = require("discord.js")
const fs = require("fs")
module.exports = {
  customId: "joke",
  /**
   * Joke Command
   * 
   * @param {Message} message
   * @param {Client} client
   */
  async execute(message, client) {
    message.channel.send("https://tenor.com/view/the-office-michael-scott-steve-carrell-unamused-meh-gif-16391448")
  }
}