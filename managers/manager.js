/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { Client } = require("discord.js");
const { UtilityCollection } = require("../classes/utilityCollection");
const ascii = require("ascii-table");
const utility = new UtilityCollection()

class ManagerClient extends Client {
  //Load Command Methods
  async loadCommands() {
    const table = new ascii().setHeading("Commands", "Status");

    await this.commands.clear();

    let commandsArray = [];

    const Files = await utility.loadFiles("commands");

    Files.forEach((file) => {
      const command = require(file);
      this.commands.set(command.data.name, command);

      commandsArray.push(command.data.toJSON());

      table.addRow(command.data.name, "🟩");
    });

    this.application.commands.set(commandsArray);

    return console.log(table.toString());
  }

  //Load Events
  async loadEvents() {
    const table = new ascii().setHeading("Events", "Status");
    const Discord = require("discord.js");
    /**
     * @param { Discord.Client } client
     */
    await this.events.clear();
    const Files = await utility.loadFiles("events");

    Files.forEach((file) => {
      const event = require(file);

      let execute = (...args) => event.execute(...args, this);
      this.events.set(event.name, execute);

      if (event.rest) {
        if (event.once) client.rest.on(event.name, execute);
        else this.rest.on(event.name, execute);
      } else {
        if (event.once) client.once(event.name, execute);
        else this.on(event.name, execute);
      }
      event.name == ""
        ? table.addRow("Error", "🟥")
        : table.addRow(event.name, "🟩");
    });

    return console.log(table.toString());
  }

  //Load Buttons
  async loadButtons() {
    const table = new ascii().setHeading("Buttons", "Status");

    await this.buttons.clear();

    const Files = await utility.loadFiles("buttons");

    Files.forEach((file) => {
      const button = require(file);
      this.buttons.set(button.customId, button);
      table.addRow(button.customId, "🟩");
    });
    return console.log(table.toString());
  }


  //Load Select Menus
  async loadSelectMenus() {
    const table = new ascii().setHeading("Select Menus", "Status");

    await this.selectMenus.clear();

    const Files = await utility.loadFiles("select");

    Files.forEach((file) => {
      const selectMenu = require(file);
      this.selectMenus.set(selectMenu.customId, selectMenu);
      table.addRow(selectMenu.customId, "🟩");
    });
    return console.log(table.toString());
  }


  //Load Modals
  async loadModals() {
    const table = new ascii().setHeading("Modals", "Status");

    await this.modals.clear();

    const Files = await utility.loadFiles("modals");

    Files.forEach((file) => {
      const modal = require(file);
      this.modals.set(modal.customId, modal);
      table.addRow(modal.customId, "🟩");
    });
    return console.log(table.toString());
  }


  //Load Analog Commands
  async loadAnalogCommands() {
    const table = new ascii().setHeading("Analog Commands", "Status");

    await this.analogCommands.clear();

    const Files = await utility.loadFiles("analogCommands");

    Files.forEach((file) => {
      const command = require(file);
      this.analogCommands.set(command.customId, command);
      table.addRow(command.customId, "🟩");
    });
    return console.log(table.toString());
  }

  //Reload Commands
  async reloadCommands() {
    this.loadCommands();
  }

  //Reload Events
  async reloadEvents() {
    for (let [key, value] of this.events) {
      this.removeListener(key, value);
    }

    await this.loadEvents();
  }

  //Reload Buttons
  async reloadButtons() {
    this.loadButtons()
  }

  //Reload SelectMenus
  async reloadSelectMenus() {
    this.loadSelectMenus()
  }

  //Reload Modals
  async reloadModals() {
    this.loadModals()
  }

  //Reload Analog Commands
  async reloadAnalogCommands() {
    this.loadAnalogCommands()
  }

  //Load CronJobs
  async loadCronJobs() {
    const table = new ascii().setHeading("CronJobs", "Status");

    await this.cronJobs.clear();

    const Files = await utility.loadFiles("cronJobs");

    Files.forEach((file) => {
      const cronJob = require(file);
      this.cronJobs.set(cronJob.customId, cronJob);
      table.addRow(cronJob.customId, "🟩");
    });
    return console.log(table.toString());
  }

}
module.exports = {
  ManagerClient,
};
