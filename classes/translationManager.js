/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { DataBaseInterface } = require("./dataBaseInterface")
const dotenv = require("dotenv");
const database = new DataBaseInterface()
const fs = require("fs");
dotenv.config({
    path: "./../config.env",
  });
const defaultLanguageShort = process.env.DEFAULT_LANGUAGE

class TranslationManager {
    /**
     * Handles the Translation Files
     * 
     * @param { String } userId 
     */
    constructor(userId) {

        //Delete Language of User
        this.deleteUserLanguage = async function () {
            return await database.deleteObject(`${userId}.language`)
        }

        //Save Language of User
        this.saveUserLanguage = async function (languageShort) {
            await this.deleteUserLanguage()
            return await database.setUserValue(userId, ".language", languageShort)
        }

        //Get Users Language
        this.getUserLanguage = async function() {
            this.userLanguageData = await database.getObject(`${userId}`)
            switch(this.userLanguageData == null || this.userLanguageData.language == undefined) {
                case false: return this.userLanguageData.language
                case true: return defaultLanguageShort
            }
        }

        //Get Translation for Translation Key 
        this.getTranslation = async function (key) {
            this.userLanguage = await this.getUserLanguage()
            return JSON.parse(await fs.promises.readFile(`translations/${this.userLanguage}.json`))[key]
        }
    }
}

module.exports = {
    TranslationManager
}