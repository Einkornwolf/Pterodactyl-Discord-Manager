/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

class AxiosDataGenerator {
  /**
   * Generates a matching Axios Config
   *
   * @param {*} authKey
   */
  constructor(authKey) {
    this.generateConfig = function () {
      return {
        headers: {
          Authorization: `Bearer ${authKey}`,
          "Content-Type": `application/json`,
          Accept: `application/json`,
        },
      };
    };
  }
}

module.exports = {
  AxiosDataGenerator,
};
