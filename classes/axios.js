/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { AxiosDataGenerator } = require("./axiosDataGenerator");
const axiosParam = require("axios");
const http = require("http");
const https = require("https");

class Axios {
  /**
   * Handles Axios HTTP Requests and communicates with the Pterodactyl Panel
   *
   * @param {axiosParam.Axios} axiosInstance
   * @param {String} baseLink
   * @param {String} applicationAuthKey
   * @param {String} clientAuthKey
   */
  constructor(axiosInstance, baseLink, applicationAuthKey, clientAuthKey) {
    //Get Application Axios Config
    this.applicationConfigGenerator = new AxiosDataGenerator(applicationAuthKey);
    this.applicationConfig = this.applicationConfigGenerator.generateConfig();
    //Get Client Axios Config
    this.clientConfigGenerator = new AxiosDataGenerator(clientAuthKey);
    this.clientConfig = this.clientConfigGenerator.generateConfig();

    //Axios Get
    this.get = async function (linkExtension, type) {
      switch (type) {
        case `application`:
          return await axiosInstance.get(
            `${baseLink}${linkExtension}`,
            Object.assign({}, this.applicationConfig, {
              timeout: this.applicationConfig.timeout || 15000,
              httpAgent: new http.Agent({ keepAlive: true }),
              httpsAgent: new https.Agent({ keepAlive: true }),
            })
          );
          break;
        case `client`: {
          return await axiosInstance.get(
            `${baseLink}${linkExtension}`,
            Object.assign({}, this.clientConfig, {
              timeout: this.clientConfig.timeout || 15000,
              httpAgent: new http.Agent({ keepAlive: true }),
              httpsAgent: new https.Agent({ keepAlive: true }),
            })
          );
          break;
        }
        default:
          return null;
      }
    };

    //Axios Post
    this.post = async function (linkExtension, data, type) {
      switch (type) {
        case `application`:
          return await axiosInstance.post(
            `${baseLink}${linkExtension}`,
            data,
            Object.assign({}, this.applicationConfig, {
              timeout: this.applicationConfig.timeout || 15000,
              httpAgent: new http.Agent({ keepAlive: true }),
              httpsAgent: new https.Agent({ keepAlive: true }),
            })
          );
        case `client`: {
          return await axiosInstance.post(
            `${baseLink}${linkExtension}`,
            data,
            Object.assign({}, this.clientConfig, {
              timeout: this.clientConfig.timeout || 15000,
              httpAgent: new http.Agent({ keepAlive: true }),
              httpsAgent: new https.Agent({ keepAlive: true }),
            })
          );
        }
        default:
          return null;
      }
    };

    //Axios Delete
    this.delete = async function (linkExtension, type) {
      switch (type) {
        case `application`:
          return await axiosInstance.delete(
            `${baseLink}${linkExtension}`,
            Object.assign({}, this.applicationConfig, {
              timeout: this.applicationConfig.timeout || 15000,
              httpAgent: new http.Agent({ keepAlive: true }),
              httpsAgent: new https.Agent({ keepAlive: true }),
            })
          );
        case `client`: {
          return await axiosInstance.delete(
            `${baseLink}${linkExtension}`,
            Object.assign({}, this.clientConfig, {
              timeout: this.clientConfig.timeout || 15000,
              httpAgent: new http.Agent({ keepAlive: true }),
              httpsAgent: new https.Agent({ keepAlive: true }),
            })
          );
        }
        default:
          return null;
      }
    };

    //Axios Patch
    this.patch = async function (linkExtension, data, type) {
      switch (type) {
        case `application`:
          return await axiosInstance.patch(
            `${baseLink}${linkExtension}`,
            data,
            Object.assign({}, this.applicationConfig, {
              timeout: this.applicationConfig.timeout || 15000,
              httpAgent: new http.Agent({ keepAlive: true }),
              httpsAgent: new https.Agent({ keepAlive: true }),
            })
          );
        case `client`: {
          return await axiosInstance.patch(
            `${baseLink}${linkExtension}`,
            data,
            Object.assign({}, this.clientConfig, {
              timeout: this.clientConfig.timeout || 15000,
              httpAgent: new http.Agent({ keepAlive: true }),
              httpsAgent: new https.Agent({ keepAlive: true }),
            })
          );
        }
        default:
          return null;
      }
    };
  }
}

module.exports = {
  Axios,
};
