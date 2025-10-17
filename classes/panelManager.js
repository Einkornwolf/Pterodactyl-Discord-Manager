/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { Axios } = require("./axios");
const { Password } = require("./passwordGenerator");
const { DataBaseInterface } = require("./dataBaseInterface");
const axiosInstance = require("axios");
const database = new DataBaseInterface();
const dotenv = require("dotenv");
const { RichPresenceAssets, CommandInteractionOptionResolver } = require("discord.js");
const { default: axios } = require("axios");
dotenv.config({
  path: "./../config.env",
});
serverDeletionOffset = process.env.DELETION_OFFSET;

class PanelManager {
  /**
   * Handles the communication between the Panel and the Bot
   *
   * @param {*} link
   * @param {*} apiKey
   * @param {*} accountKey
   * @param {Axios} this.axios
   */
  constructor(link, apiKey, accountKey) {
    this.axios = new Axios(axiosInstance, link, apiKey, accountKey);

    // Generic retry wrapper for panel requests (handles transient 504)
    this._withRetries = async function (fn, maxAttempts = 3) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn();
        } catch (e) {
          const statusCode = e && e.response && e.response.status;
          console.warn(`Panel request attempt ${attempt} failed with ${e && e.message} (status: ${statusCode})`);
          // Log stack for debugging undefined property errors
          if (e && e.stack) console.warn(e.stack);
          if ((statusCode === 504 || statusCode === 502 || statusCode === 503) && attempt < maxAttempts) {
            // backoff
            await new Promise((r) => setTimeout(r, attempt * 1000));
            continue;
          }
          throw e;
        }
      }
    };

    //Check if User has an Account
    this.checkAccount = async function (eMail) {
      this.userData;
      this.userDataObject = await this.axios.get(
        `/api/application/users?filter[email]=${eMail}&include=servers&per_page=10000`,
        "application"
      );
      this.userData = this.userDataObject.data.data.find(user => user.attributes.email == eMail)
      return this.userData;
    };

    //Add User to Panel
    this.addUser = async function (
      eMail,
      username,
      firstName,
      lastName,
      passkey
    ) {
      passkey
        ? (this.password = passkey)
        : (this.password = await new Password().generatePassword(10));
      return await this.axios.post(
        `/api/application/users`,
        {
          email: eMail,
          username: username,
          first_name: firstName,
          last_name: lastName,
          password: this.password,
        },
        "application"
      )
    };

    //Remove User from Panel
    this.removeUser = async function (eMail) {
      this.userAccountData = await this.checkAccount(eMail);
      if (!this.userAccountData) return
      this.user = this.userAccountData.attributes.id;
      return await this.axios.delete(
        `/api/application/users/${this.user}`,
        "application"
      );
    };

    //Reset User Password
    this.resetUserPassword = async function (eMail, passkey) {
      passkey
        ? (this.password = passkey)
        : (this.password = await new Password().generatePassword(15));
      this.userAccountData = await this.checkAccount(eMail);
      this.userData = this.userAccountData.attributes;
      let { username, first_name, last_name } = this.userData
      let awaitAxiosData = await this.axios.patch(
        `/api/application/users/${this.userData.id}`,
        {
          email: eMail,
          username: username,
          first_name: first_name,
          last_name: last_name,
          password: this.password,
        },
        "application"
      );
      return {
        data: awaitAxiosData,
        passkey: this.password
      }
    };

    //Get Nodes on Panel
    this.getPanelNodes = async function () {
      let nodeArray = new Array();
      this.nodeData = await this.axios.get(
        `/api/application/nodes?per_page=10000&include=servers`,
        "application"
      );
      nodeArray = this.nodeData.data.data.map(node => node)
      return nodeArray;
    };

    //Get Allocations from Node
    this.getAllocations = async function (nodeId) {
      this.allocationData = await this.axios.get(
        `/api/application/nodes/${nodeId}/allocations?per_page=10000`,
        "application"
      );
      return this.allocationData.data.data;
    };

    //Get Nest-Data from Panel
    this.getNestData = async function (eggId) {
      this.nestData = await this.axios.get(
        `/api/application/nests?per_page=10000&include=eggs`,
        "application"
      );
      return this.nestData.data.data;
    };

    //Get Egg Data from Panel
    this.getEggData = async function (eggId, nestId) {
      this.eggData = await this.axios.get(
        `/api/application/nests/${nestId}/eggs/${eggId}?per_page=10000&include=config,script,variables`,
        "application"
      );
      return this.eggData.data;
    };

    //Create Server
    this.createServer = async function (eMail, serverName, eggId, memoryAmount, swapAmount, diskAmount, ioValue, cpuPercentage, databaseAmount, backupAmount) {
      // Get User Data (with retries)
      this.userData = await this._withRetries(() => this.checkAccount(eMail));
      if (!this.userData) throw new Error(`Panel createServer: user not found for email=${eMail}`);
      // Get Node Data
      this.nodeData = await this._withRetries(() => this.getPanelNodes());
      if (!this.nodeData || !Array.isArray(this.nodeData) || this.nodeData.length === 0) throw new Error(`Panel createServer: no node data returned from panel`);
      // Get Amount of Servers on each Node
      this.nodeServerAmount = this.nodeData.map(node => node.attributes.relationships.servers.data.length);
      // Get Node with least amount of Servers
      this.lowestNode = this.nodeData[this.nodeServerAmount.indexOf(Math.min(...this.nodeServerAmount))];
      if (!this.lowestNode) throw new Error(`Panel createServer: could not determine lowestNode from nodeData`);
      // Get Allocations on Node
      this.allocations = await this._withRetries(() => this.getAllocations(this.lowestNode.attributes.id));
      if (!this.allocations || !Array.isArray(this.allocations)) throw new Error(`Panel createServer: no allocations returned for node ${this.lowestNode && this.lowestNode.attributes && this.lowestNode.attributes.id}`);
      //Get Free Allocations
      this.freeAllocations = this.allocations.filter(allocation => allocation.attributes.assigned == false)
      this.freeAllocationIds = this.freeAllocations.map(allocation => allocation.attributes.id)
      if (!this.freeAllocationIds || this.freeAllocationIds.length === 0) throw new Error(`Panel createServer: no free allocations available on node ${this.lowestNode && this.lowestNode.attributes && this.lowestNode.attributes.id}`);
      //Get Nests
      this.nestData = await this.getNestData();
      //Get chosen Egg Data
      this.chosenNestData = this.nestData.find(nest => nest.attributes.relationships.eggs.data.some(egg => egg.attributes.id == eggId))
      if (!this.chosenNestData) throw new Error(`Panel createServer: chosenNestData not found for eggId=${eggId}`);
      this.chosenEggData = this.chosenNestData.attributes.relationships.eggs.data.find(egg => egg.attributes.id == eggId)
      if (!this.chosenEggData) throw new Error(`Panel createServer: chosenEggData not found for eggId=${eggId}`);
      //Retreive Egg Enviroment Variables
      this.complexEggData = await this._withRetries(() => this.getEggData(
        eggId,
        this.chosenEggData.attributes.nest
      ));
      if (!this.complexEggData) throw new Error(`Panel createServer: complexEggData missing for eggId=${eggId}`);
      this.enviromentVariables =
        this.complexEggData.attributes.relationships.variables.data;
      this.populatedEnviromentVariables = new Object();
      for (let variable of this.enviromentVariables) {
        //Check if Enviroment Variable is required
        if (variable.attributes.rules.includes("required"))
          this.populatedEnviromentVariables[
            variable.attributes.env_variable
          ] = variable.attributes.default_value;
      }
      //Create Server (with retries)
      return await this._withRetries(() => this.axios.post(
        `/api/application/servers`,
        {
          name: serverName,
          user: this.userData.attributes.id,
          egg: eggId,
          docker_image: this.complexEggData.attributes.docker_image,
          startup: this.chosenEggData.attributes.startup,
          environment: this.populatedEnviromentVariables,
          limits: {
            memory: memoryAmount,
            swap: swapAmount,
            disk: diskAmount,
            io: ioValue,
            cpu: cpuPercentage,
          },
          feature_limits: {
            databases: databaseAmount,
            backups: backupAmount,
          },
          allocation: {
            default: this.freeAllocationIds[Math.floor(Math.random() * this.freeAllocationIds.length)]
          },
        },
        "application"
      ));
    };

    //Delete Server
    this.deleteServer = async function (serverId) {
      this.responseData = await this.axios.delete(
        `/api/application/servers/${serverId}`,
        "application"
      );
      return this.responseData.data;
    };

    //Get all Servers from a User
    this.getAllServers = async function (eMail) {
      this.userData = await this.checkAccount(eMail);
      return this.userData ? this.userData.attributes.relationships.servers.data : null;
    };

    //Check if server is still being installed
    this.getInstallStatus = async function (serverIdentifier) {
      try {
        this.serverUsage = await this.axios.get(`/api/client/servers/${serverIdentifier}/resources`, "client")
        return true
      } catch (e) { return false }
    }

    //Get Live Ressource Usage from a specific Server
    this.liveServerRessourceUsage = async function (serverId) {
      try {
        this.serverUsage = await this.axios.get(
          `/api/client/servers/${serverId}/resources`,
          "client"
        );
        return this.serverUsage.data;
      } catch (e) { return undefined }
    };

    //Get Info from specific Server
    this.getServerInfo = async function (serverIdentifier) {
      this.serverData = await this.axios.get(
        `/api/client/servers/${serverIdentifier}`,
        "client"
      );
      return this.serverData.data;
    };

    //Power Up / Down Server
    this.powerEventServer = async function (serverIdentifier, type) {
      this.responseData = await this.axios.post(
        `/api/client/servers/${serverIdentifier}/power`,
        {
          signal: type,
        },
        "client"
      );
      return this.responseData.data;
    };

    //Reinstall Server
    this.reinstallServer = async function (serverIdentifier) {
      this.responseData = await this.axios.post(
        `/api/client/servers/${serverIdentifier}/settings/reinstall`,
        {},
        "client"
      );
      return this.responseData.data;
    };

    //Rename Server
    this.renameServer = async function (serverIdentifier, newName) {
      this.responseData = await this.axios.post(
        `/api/client/servers/${serverIdentifier}/settings/rename`,
        {
          name: newName,
        },
        "client"
      );
      return this.responseData.data;
    };

    //Get Server ID from UUID
    this.getServerId = async function (uuid) {
      this.responseData = await this.axios.get(
        `/api/application/servers?per_page=10000`, "application"
      );
      this.serverData = this.responseData.data.data.find(server => server.attributes.uuid == uuid)
      if (!this.serverData) return null
      let { attributes: { id } } = this.serverData
      return id;
    };

    //Get Server ID from UUID
    this.getServerIdentifier = async function (uuid) {
      this.responseData = await this.axios.get(
        `/api/application/servers?per_page=10000`, "application"
      );
      this.serverData = this.responseData.data.data.find(server => server.attributes.uuid == uuid)
      if (!this.serverData) return null
      let { attributes: { identifier } } = this.serverData
      return identifier;
    };

    //Suspend Server
    this.suspendServer = async function (serverId) {
      this.responseData = await this.axios.post(
        `/api/application/servers/${serverId}/suspend`,
        {},
        "application"
      );
      return this.responseData.data;
    };

    //Unsuspend Server
    this.unSuspendServer = async function (serverId) {
      this.responseData = await this.axios.post(
        `/api/application/servers/${serverId}/unsuspend`,
        {},
        "application"
      );
      return this.responseData.data;
    };

    //Server Runtimes

    //Add Server to Runtime List
    this.setServerRuntime = async function (
      serverUuid,
      runtime,
      userId,
      serverPrice
    ) {
      this.runtimeObject = {
        uuid: serverUuid,
        user_id: userId,
        runtime: runtime,
        price: serverPrice,
        date_created: {
          date: new Date(),
        },
        date_running_out: {
          date: new Date(new Date().getTime() + runtime * 86400000),
        },
      };
      return await database.pushObject(
        "runtime_server_list",
        this.runtimeObject
      );
    };

    //Set Runtime List
    this.setRuntimeList = async function (data) {
      return await database.setObject("runtime_server_list", data);
    };

    //Get Runtime List
    this.getRuntimeList = async function () {
      this.list = await database.getObject("runtime_server_list");
      if (!this.list) return null
      return this.list
    };

    //Remove Server from Suspension List
    this.removeServerSuspensionList = async function (serverUuid) {
      this.runtimeList = await this.getRuntimeList();
      this.newRuntimeList = this.runtimeList.filter(server => server.uuid != serverUuid)
      await this.setRuntimeList(this.newRuntimeList);
    };

    //Add Server to Deletion List ( from Suspension List)
    this.addServerDeletion = async function (serverUuid, runtime, userId, serverPrice) {
      this.runtimeList = await this.getRuntimeList();
      this.selectedServer = this.runtimeList.find(server => server.uuid == serverUuid)
      let { date_running_out, date_created } = this.selectedServer
      return await database.pushObject("delete_server_list", {
        uuid: serverUuid,
        user_id: userId,
        runtime: runtime,
        price: serverPrice,
        date_created: date_created,
        deletion_date: {
          date: new Date(
            new Date(date_running_out.date).getTime() +
            serverDeletionOffset * 86400000
          ),
        }
      });
    }

    //Set Deletion List
    this.setDeletionList = async function (data) {
      return await database.setObject("delete_server_list", data);
    };

    /**
     * 
     * Get full List of all Servers which are on the Deletion-List
     * 
     * @returns null if the Deletion-List is empty. Instead returns the List if it is not.
     */
    this.getDeletionList = async function () {
      this.list = await database.getObject("delete_server_list");
      if (!this.list) return null
      return this.list
    };

    /**
     * 
     * Removes a specific Server from the Deletion List
     * 
     * @param {} serverUuid Panel UUID of the specific Server
     * @returns null if the Deletion-List is emtpy. Else nothing is returned.
     */
    this.removeServerDeletionList = async function (serverUuid) {
      this.deletionList = await this.getDeletionList();
      if (!this.deletionList) return null
      this.newDeletionList = this.deletionList.filter(server => server.uuid != serverUuid)
      await this.setDeletionList(this.newDeletionList);
    };

    /**
     * 
     * Get all Runtime specific Data from a specific Server from the Database
     * 
     * @param {} serverIdentifier Short panel Identifier of the Server
     * @returns the Suspension or Deletion Data of the Server
     */
    this.getServerRuntime = async function (serverIdentifier) {
      this.serverData = await this.getServerInfo(serverIdentifier);
      this.serverUuid = this.serverData.attributes.uuid;

      this.runtimeList = await this.getRuntimeList();
      this.deletionList = await this.getDeletionList();

      if (this.runtimeList != null) {
        for (let server of this.runtimeList)
          if (server.uuid == this.serverUuid)
            return {
              status: true,
              type: "suspension",
              data: server,
            };
      }

      if (this.deletionList != null) {
        for (let server of this.deletionList)
          if (server.uuid == this.serverUuid)
            return {
              status: true,
              type: "deletion",
              data: server,
            };
      }

      return {
        status: false,
        type: "error",
      };
    };


    /**
     * 
     * Extends a Servers Runtime from previously already having a runtime
     * 
     * @param {} serverIdentifier Short Panel Identifier of the Server
     * @param {} runtimeExtension Amount of Days the Server should be extended
     * @returns the Database Action
     */
    this.extendRuntime = async function (serverIdentifier, runtimeExtension) {
      this.suspensionList = await this.getRuntimeList();
      this.deletionList = await this.getDeletionList();
      this.serverData = await this.getServerInfo(serverIdentifier);
      this.serverUuid = this.serverData.attributes.uuid;

      //Server needs to be extended from runtime List
      for (let server of this.suspensionList)
        if (server.uuid == this.serverUuid) {
          await this.removeServerSuspensionList(this.serverUuid);
          return await database.pushObject("runtime_server_list", {
            uuid: this.serverUuid,
            user_id: server.user_id,
            runtime: server.runtime,
            price: server.price,
            date_created: server.date_created,
            date_running_out: {
              date: new Date(
                new Date(
                  server.date_running_out.date
                ).getTime() +
                runtimeExtension * 86400000
              ),
            },
          });
        }

      //Server needs to be extended from deletion List
      for (let server of this.deletionList)
        if (server.uuid == this.serverUuid) {
          await this.removeServerDeletionList(this.serverUuid);
          return await database.pushObject("runtime_server_list", {
            uuid: this.serverUuid,
            user_id: server.user_id,
            runtime: server.runtime,
            price: server.price,
            date_created: server.date_created,
            date_running_out: {
              date: new Date(
                new Date(server.deletion_date.date).getTime() +
                runtimeExtension * 86400000
              ),
            },
          });
        }
    };

    /**
     * 
     * Deletes all Servers from a specific User of the Panel
     * 
     * @param {*} eMail The E-Mail of the User 
     * @returns Nothing
     */
    this.deleteAllServers = async function (eMail) {
      this.userServers = await this.getAllServers(eMail);
      if (!this.userServers || this.userServers.length == 0) return
      for (let server of this.userServers) {
        await this.deleteServer(server.attributes.id);
        try {
          await this.removeServerSuspensionList(
            server.attributes.uuid
          );
          await this.removeServerDeletionList(
            server.attributes.uuid
          );
        } catch (e) { }
      }
    };


    /**
     * 
     * @returns A filtered List of all UUID of Servers who are owned by a User in the User-Database of the Bot
     */
    this.getAccumulatedUserServers = async function () {
      this.database = await database.fetchAll()
      this.users = this.database.filter((object) => {
        if (object.id.length == 18) return true
      }).map(user => user.value.e_mail)

      //Get All Servers from the Panel
      let allServers = await this.axios.get("/api/application/servers?per_page=10000&include=user", "application")
      this.serverList = []

      for (let i = 0; i < allServers.data.data.length; i++) {
        if (this.users
          .includes(allServers.data.data[i].attributes.relationships.user.attributes.email)) {
          this.serverList.push(allServers.data.data[i].attributes.uuid)
        }
      }

      return this.serverList ?? null

    }

    /**
     * 
     * Retreive a Users Discord ID via a Servers UUID
     * 
     * @param {*} uuid The UUID of the Server
     * @returns the Discord id of the User or null if the Server does not belong to a User.
     */
    this.getUserIDfromUUID = async function (uuid) {
      this.database = await database.fetchAll()
      this.users = this.database.filter((object) => {
        if (object.id.length == 18) return true
      })
      this.userEmails = this.users.map(user => user.value.e_mail)

      //Get Server Data
      this.serverId = await this.getServerId(uuid)
      let server = await this.axios.get(`/api/application/servers/${this.serverId}?include=user`, "application")

      let email = server.data.attributes.relationships.user.attributes.email

      let index = this.userEmails.indexOf(email)

      let id = this.users[index].id

      return id
    }

    /**
 * 
 * Check if a Client API Key is valid and retreive connected Account E-Mail
 * 
 * @param {*} key API Key
 * @returns E-Mail of connected Account or null (if Account does not exist)
 */
    this.getUserEmailFromAPIKey = async function (key) {
      this.database = await database.fetchAll()
      this.users = this.database.filter((object) => {
        if (object.id.length == 18) return true
      })

      this.userEmails = this.users.map(user => user.value.e_mail)

      let accountData = null;
      let tempAxios = new Axios(axiosInstance, link, apiKey, key);
      try {
        accountData = await tempAxios.get(`/api/client/account`, "client")
      } catch (e) {
        return null;
      }
      if (!accountData) return null;
      let eMail = accountData.data.attributes.email;
      if (!eMail) return null;
      return eMail;
    }


    /**
 * 
 * Check if a Local Database Entry for an E-Mail is present
 * 
 * @param {*} eMail E-Mail
 * @returns true or false
 */
    this.checkLocalAccount = async function (eMail) {
      if (!eMail) return false;
      const normalizedEmail = String(eMail).toLowerCase();
      this.database = await database.fetchAll();
      if (!Array.isArray(this.database) || this.database.length === 0) return false;

      const users = this.database.filter((obj) => obj && obj.id && String(obj.id).length === 18);

      const found = users.find((u) => u.value && u.value.e_mail && String(u.value.e_mail).toLowerCase() === normalizedEmail);
      return !!found;
    };

  }
}



module.exports = {
  PanelManager,
};
