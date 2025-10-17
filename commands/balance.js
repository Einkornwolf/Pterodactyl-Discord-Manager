/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const Canvas = require("@napi-rs/canvas");
const { request } = require("undici");
const { PanelManager } = require("../classes/panelManager")
const { TranslationManager } = require("./../classes/translationManager")
const { BoosterManager } = require("./../classes/boosterManager")
const { CacheManager } = require("./../classes/cacheManager")
const { EconomyManager } = require("./../classes/economyManager")
const { LogManager } = require("./../classes/logManager")
const { DataBaseInterface } = require("./../classes/dataBaseInterface")
const { UtilityCollection } = require("./../classes/utilityCollection")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, Base, SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require("discord.js")

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

const { EmojiManager } = require("./../classes/emojiManager")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Retreive your balance")
    .addUserOption((option) =>
      option.setName("user").setDescription("User").setRequired(false)
    ),
  /**
   * Show user how many coins he has
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
   * @returns 
   */
  async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t, giftCodeManager, emojiManager) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    let { user: { id: userId, tag }, user: user } = interaction, fetchedUser = await user.fetch(true), { accentColor } = fetchedUser
    const guild = interaction.guild;
    const serverIconURL = guild ? guild.iconURL({ dynamic: true }) : undefined
    let userData = await databaseInterface.getObject(userId), utility = new UtilityCollection(), foreignUser = interaction.options.getUser("user")


    //Given user
    if (foreignUser) {
      let receiverData = await databaseInterface.getObject(foreignUser.id)
      switch (process.env.ADMIN_LIST.includes(userId)) {
        case false: {
          //Reply that the User is no Admin
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.no_admin_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("errors.no_admin_text")}**`)
                .setColor(accentColor ? accentColor : 0xe6b04d)
                .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                .setTimestamp()
            ],
            flags: MessageFlags.Ephemeral,
          });
          //Logging
          await logManager.logString(`${tag} tried to view the balance of User ${foreignUser.tag} without admin permissions`)
          break;
        }

        case true: {
          //Check if Receiver has an Account
          switch (receiverData == null) {
            case true: {
              await interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("coins.no_account_send_label")} ${await emojiManager.getEmoji("emoji_error")}`)
                    .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("coins.no_account_send_text")}**`)
                    .setColor(accentColor ? accentColor : 0xe6b04d)
                    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                    .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
              });
              await logManager.logString(`${tag} tried to view the balance of a User who does not have an Account`)
              return
            }
            case false: {
              //Get Foreign Users balance
              let userBalance = await economyManager.getUserBalance(foreignUser.id)
              //Canvas
              let canvas = Canvas.createCanvas(700, 250), context = canvas.getContext("2d")
              //Gradient
              let gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
              gradient.addColorStop(0, "#412666ff"), gradient.addColorStop(1, "#9b88f0ff"), context.fillStyle = gradient, context.fillRect(0, 0, canvas.width, canvas.height)
              //Stroke
              context.lineWidth = 10, context.strokeStyle = "#9b88f0ff", context.strokeRect(0, 0, canvas.width, canvas.height)
              //Font
              context.font = "50px", context.fillStyle = "#bbea13ff"
              //Headline
              context.fillText(`${await t("coins.balance_label")}`, canvas.width / 2.5, canvas.height / 2.75)
              //Text Font
              let canvasText = `${userBalance ? userBalance : 0} Coins!`;
              context.font = await utility.getCanvasFontSize(canvas, canvasText, "", 70, 150), context.fillStyle = "#bbea13ff", context.fillText(canvasText, canvas.width / 3, canvas.height / 1.35)
              //Clip around next Object
              context.beginPath(), context.arc(75, 75, 50, 0, Math.PI * 2, true), context.closePath(), context.clip()
              //Add User Avatar
              let { body } = await request(foreignUser.displayAvatarURL({ extension: "jpg" })), avatar = await Canvas.loadImage(await body.arrayBuffer())
              context.drawImage(avatar, 25, 25, 100, 100), context.stroke()
              let attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "canvas.png" })


              await interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(accentColor ? accentColor : 0xe6b04d)
                    .setImage(`attachment://${attachment.name}`),
                ],
                files: [attachment],
                flags: MessageFlags.Ephemeral,
              });
              //Logging
              await logManager.logString(`${tag} viewed the balance of the User ${foreignUser.tag}`)
              return
            }
          }
        }
      }
    }


    //User who executed the command
    //Check if User has an Account
    if (userData == null) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${await emojiManager.getEmoji("emoji_error")} ${await t("errors.no_account_label")} ${await emojiManager.getEmoji("emoji_error")}`)
            .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("coins.no_account_text")}**`)
            .setColor(accentColor ? accentColor : 0xe6b04d)
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
            .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral
      })
      await logManager.logString(`${tag} tried to use /balance without an Account`)
      return
    }


    //Canvas
    let canvas = Canvas.createCanvas(700, 250), context = canvas.getContext("2d")
    //Gradient
    let gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "#412666ff"), gradient.addColorStop(1, "#9b88f0ff"), context.fillStyle = gradient, context.fillRect(0, 0, canvas.width, canvas.height)
    //Stroke
    context.lineWidth = 10, context.strokeStyle = "#412666ff", context.strokeRect(0, 0, canvas.width, canvas.height)
    //Font
    context.font = "50px", context.fillStyle = "#bbea13ff"
    //Headline
    context.fillText(`${await t("coins.balance_label")}`, canvas.width / 2.5, canvas.height / 2.75)
    //Text Font
    let canvasText = `${await t("coins.balance_text")} ${userData.balance ? userData.balance : 0} Coins!`;
    context.font = await utility.getCanvasFontSize(canvas, canvasText, "", 70, 150), context.fillStyle = "#bbea13ff", context.fillText(canvasText, canvas.width / 6, canvas.height / 1.35)
    //Clip around next Object
    context.beginPath(), context.arc(75, 75, 50, 0, Math.PI * 2, true), context.closePath(), context.clip()
    //Add User Avatar
    let { body } = await request(interaction.user.displayAvatarURL({ extension: "jpg" })), avatar = await Canvas.loadImage(await body.arrayBuffer())
    context.drawImage(avatar, 25, 25, 100, 100), context.stroke()
    let attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "canvas.png" })


    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(accentColor ? accentColor : 0xe6b04d)
          .setImage(`attachment://${attachment.name}`),
      ],
      files: [attachment],
      flags: MessageFlags.Ephemeral,
    });
    //Logging
    await logManager.logString(`${tag} checked their balance: ${userData.balance ? userData.balance : 0} Coins`)
  }
}


