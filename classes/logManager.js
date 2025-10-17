/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const fs = require("fs");

class LogManager {
    /**
     * Manages the Logging
     * 
     */
    constructor() {

        //Get Timestamp for Logging
        this.getLogTimestamp = async function () {
            this.currentDate = new Date()
            return `[${this.currentDate.getFullYear()}-${("0" + (this.currentDate.getMonth() + 1)).slice(-2)}-${("0" + this.currentDate.getDate()).slice(-2)} ${this.currentDate.getHours()}:${this.currentDate.getMinutes()}:${this.currentDate.getSeconds()} UTC+${(this.currentDate.getTimezoneOffset() /60) * -1}]`
        }

        //Check if Log File exists
        this.checkForLogFile = async function () {
            await fs.promises.readFile(`./../log/log.txt`)
            .then(async () => {
                return true
            })
            .catch(async () => {
                return false
            })
        }

        //Create Log File
        this.createLogFile = async function () {
            await fs.promises.appendFile(`./../log/log.txt`, "")
            .then(async () => {
                return true
            })
            .catch(async () => {
                return false
            })
        }

        //Log String
        this.logString = async function (data = new String) {
            this.timestamp = await this.getLogTimestamp()
            await fs.promises.appendFile(`log/log.txt`, `${this.timestamp} ${data} \n`, function (e) {})
        }
    }
}

module.exports = {
    LogManager
}