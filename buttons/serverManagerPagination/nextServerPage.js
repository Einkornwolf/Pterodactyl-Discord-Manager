/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");
const { TranslationManager } = require("../../classes/translationManager")
const { PanelManager } = require("../../classes/panelManager")
const { BoosterManager } = require("../../classes/boosterManager")
const { CacheManager } = require("../../classes/cacheManager")
const { EconomyManager } = require("../../classes/economyManager")
const { LogManager } = require("../../classes/logManager")
const { DataBaseInterface } = require("../../classes/dataBaseInterface")
const { BaseInteraction, Client, SelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags } = require("discord.js")


module.exports = {
  customId: "nextServerPage",

  /**
   * Delete server
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
   */
  async execute(interaction, client, panel, boosterManager, cacheManager, economyManager, logManager, databaseInterface, t) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    //Get User Language
    //Next / Prev Buttons
    const previousPageButton = new ButtonBuilder()
      .setCustomId("previousServerPage")
      .setLabel(`${await t("server_manager_pagination.prev_page")}`)
      .setStyle(4);

    const nextPageButton = new ButtonBuilder()
      .setCustomId("nextServerPage")
      .setLabel(`${await t("server_manager_pagination.next_page")}`)
      .setStyle(3);

    let { message: { embeds }, user: { tag, id, accentColor } } = interaction, { footer: { text } } = embeds[0], currentPageIndex = parseInt(text), nextPageIndex = currentPageIndex + 1, perPage = 25, firstServerIndex = perPage * currentPageIndex
    let userData = await databaseInterface.getObject(id), { e_mail: eMail } = userData, userServers = await panel.getAllServers(eMail), maxPageIndex = nextPageIndex * perPage

    let serverEmbed = new EmbedBuilder()
      .setTitle(`\`\`\`✍️ ${await t("server_manager_pagination.main_text")} ✍️\`\`\``)
      .setDescription(`\`\`\`${await t("server_manager_pagination.server_list_text")} ${userServers.length} ${await t("server_manager_pagination.server_list_text_two")}\`\`\``)
      .setColor(accentColor ? accentColor : 0xe6b04d)
      .setFooter({
        text: String(nextPageIndex)
      })

    let serverSelect = new SelectMenuBuilder().setCustomId("serverSelect")
    for (let i = firstServerIndex; i < userServers.length && i < maxPageIndex; i++) {
      let { attributes: { name, id, identifier } } = userServers[i], serverName = name.substring(0, 25), serverRuntime = await panel.getServerRuntime(identifier), { status, type, data } = serverRuntime, runtimeDate
      if(!userServers[i]) return
      switch (status) {
        case false: {
          runtimeDate = "N/A"
          break;
        }
        case true: {
          switch (type) {
            case "suspension": {
              let { date_running_out: { date } } = data
              runtimeDate = `🕐 <t:${Math.floor(new Date(date).setHours(0, 0, 0, 0) / 1000)}>`
              break;
            }
            case "deletion": {
              let { deletion_date: { date } } = data
              runtimeDate = `⛔ <t:${Math.floor(new Date(date).setHours(0, 0, 0, 0) / 1000)}>`;
            }
          }
        }
      }

      serverEmbed.addFields([
        {
          name: `🎮 ${await t("server_manager_pagination.server_select_label")} #${i}    ${runtimeDate}`,
          value: `\`\`\`${serverName}\`\`\``,
          inline: false,
        },
      ]);

      serverSelect.addOptions([
        {
          label: `🎮 ${await t("server_manager_pagination.server_select_label")} #${i}`,
          description: `${serverName}`,
          value: `${i}`,
        }
      ]);
    }

    let serverSelectRow = new ActionRowBuilder().addComponents(serverSelect)
    let buttonRow = new ActionRowBuilder().addComponents(previousPageButton)

    //Check if next page button is required
    if (userServers.length > nextPageIndex * perPage) {
      buttonRow.addComponents(nextPageButton)
    }

    //Check if this button got clicked with no servers above pageload index
    if(serverSelect.options.length == 0) {
      serverSelect.addOptions(
        {
          label: `N/A`,
          description: `N/A`,
          value: `N/A`,
          disabled: true
        }
      )
    }

    await interaction.editReply({
      embeds: [serverEmbed],
      components: [serverSelectRow, buttonRow],
      flags: MessageFlags.Ephemeral
    })
  },
};
