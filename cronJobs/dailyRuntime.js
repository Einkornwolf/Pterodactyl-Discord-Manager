/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { Client, Embed, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { PanelManager } = require("../classes/panelManager");
const { TranslationManager } = require("../classes/translationManager");
const { EmojiManager } = require("../classes/emojiManager")
var CronJob = require('cron').CronJob;

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

module.exports = {
  customId: "dailyRuntime",
  /**
   *
   * @param {PanelManager} panel
   * @param {Client} client
   * @param {EmojiManager} emojiManager
   */
  async execute(client, panel, database, emojiManager) {
    //Every Day at midnight
    var job = new CronJob(
      "0 0 0 * * *",
      async function () {
        const serverIconURL = undefined;
        let suspensionList = await panel.getRuntimeList(), deletionList = await panel.getDeletionList(), currentDate = new Date().setHours(0, 0, 0, 0), reminderDate = new Date(new Date().getTime() - 2 * 86400000)
        // Checks for runtimes in the system.
        console.log("Checking for runtime...");

        //Check for servers to remind
        if (suspensionList != null) {
          //Get servers which need a reminder
          let serversToRemind = suspensionList.filter(server => {
            let { date_running_out: { date } } = server
            return (reminderDate <= new Date(date).setHours(0, 0, 0, 0) && reminderDate >= new Date(new Date(date).getTime() - 5 * 86400000).setHours(0, 0, 0, 0))
          })
          //Loop and remind the user
          for (let server of serversToRemind) {
            let { user_id: userId, date_running_out: { date }, uuid } = server, user = await client.users.fetch(userId)
            //get server data
            let serverIdentifier = await panel.getServerIdentifier(uuid)
            if (serverIdentifier == null) {
              await panel.removeServerSuspensionList(uuid)
              await panel.removeServerDeletionList(uuid)
              continue //server does not exist anymore
            }
            let serverData = await panel.getServerInfo(serverIdentifier), { attributes: { name } } = serverData
            //Get translations
            const translate = new TranslationManager(userId)
            const t = async function (key) {
              return await translate.getTranslation(key)
            }
            //Try to remind user
            try {
              await user.send({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(`${await emojiManager.getEmoji("emoji_logo")}  ${await t("server_manager.main_label")}`)
                    .setDescription(`${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("reminder.text")}**`)
                    .addFields([
                      {
                        name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("add_item_button.modal_name")}**`,
                        value: `\`\`\`js\n${name}\`\`\``,
                        inline: true
                      },
                      {
                        name: `${await emojiManager.getEmoji("emoji_arrow_down_right")} **${await t("serverinfo.suspension_label")}**`,
                        value: `<t:${Math.floor(new Date(date).setHours(0, 0, 0, 0) / 1000)}>`,
                        inline: false
                      }
                    ])
                    .setColor("Red")
                    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: serverIconURL })
                    .setTimestamp()
                ]
              })
            } catch (error) {
              // User probably disabled his dms
            }
          }
        }


        //Check for Servers to Delete
        if (deletionList != null) {
          console.table(deletionList)
          let serversToDelete = deletionList.filter(server => {
            let { uuid, deletion_date: { date } } = server
            return currentDate >= new Date(date).setHours(0, 0, 0, 0)
          })

          for (let server of serversToDelete) {
            let { uuid } = server, serverId = await panel.getServerId(uuid)
            //get server data
            let serverIdentifier = await panel.getServerIdentifier(uuid)
            if (serverIdentifier == null) {
              await panel.removeServerSuspensionList(uuid)
              await panel.removeServerDeletionList(uuid)
              continue //server does not exist anymore
            }
            console.warn(`Deleting Server with UUID of: ${uuid}`)
            await panel.deleteServer(serverId)
            await panel.removeServerDeletionList(uuid)
            await panel.removeServerSuspensionList(uuid)
          }
        }


        //Check for servers to suspend
        if (suspensionList != null) {
          console.table(suspensionList)
          let serversToSuspend = suspensionList.filter(server => {
            let { uuid, date_running_out: { date } } = server
            return currentDate >= new Date(date).setHours(0, 0, 0, 0)
          })

          for (let server of serversToSuspend) {
            let { uuid, runtime, price, user_id: userId } = server, serverId = await panel.getServerId(uuid)
            //get server data
            let serverIdentifier = await panel.getServerIdentifier(uuid)
            if (serverIdentifier == null) {
              await panel.removeServerSuspensionList(uuid)
              await panel.removeServerDeletionList(uuid)
              continue //server does not exist anymore
            }
            console.warn(`Suspending Server with UUID of: ${uuid}`)
            await panel.suspendServer(serverId)
            await panel.addServerDeletion(uuid, runtime, userId, price)
            await panel.removeServerSuspensionList(uuid)
          }
        }
      },
      null,
      true,
      "Europe/Amsterdam"
    );
    //Start Cronjob
    job.start();
  },
};
