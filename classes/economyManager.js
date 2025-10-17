/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { DataBaseInterface } = require("./dataBaseInterface")

class EconomyManager extends DataBaseInterface {
    constructor() {
        super()
        //Add Coins to User
        this.addCoins = async function (userId, amount) {
            return await this.addUserValue(userId, ".balance", amount)
        }

        //Set Users Coins Amount
        this.setCoins = async function (userId, value) {
            return await this.setUserValue(userId, ".balance", value)
        }

        //Remove Coins from User
        this.removeCoins = async function (userId, amount) {
            return await this.removeUserValue(userId, ".balance", amount)
        }

        //Get Users Balance
        this.getUserBalance = async function (userId) {
            this.userData = await this.getObject(userId)
            if (this.userData == null) return null
            return this.userData.balance
        }

        //Get Total Amount of Coins in Database
        this.getTotalCoinAmount = async function () {
            this.entireDatabase = await this.fetchAll()
            this.totalCoinAmount = 0
            for (let object of this.entireDatabase) {
                let { value: { balance } } = object
                if (object) if (balance != undefined) this.totalCoinAmount += balance
            }
            return this.totalCoinAmount
        }

        //Get List of top Users in Reversed Order
        this.getTopUsers = async function () {
            this.userDatabase = await this.fetchAll()
            await this.userDatabase.sort(function (a, b) { if (a.value.balance == undefined) return -Infinity; return a.value.balance - b.value.balance })
            this.userDatabase = this.userDatabase.filter(user => {               // Kein Key = kein gültiger User
                if (!user.value?.balance) return false;        // Kein Balance-Feld = überspringen          // z. B. falls Key keine Discord-ID ist
                return true;
            });
            return this.userDatabase
        }

        //Add Daily Amount to User
        this.addDailyAmount = async function (userId, amount) {
            return await this.addUserValue(userId, ".daily", amount)
        }

        //Set Users Daily Amount
        this.setDailyAmount = async function (userId, value) {
            return await this.setUserValue(userId, ".daily", value)
        }

        //Remove Daily Amount from User
        this.removeDailyAmount = async function (userId, amount) {
            return await this.removeUserValue(userId, ".daily", amount)
        }

        //Get Users Daily 
        this.getUserDaily = async function (userId) {
            this.userData = await this.getObject(userId)
            return this.userData.daily
        }

        //Reset all Dailys
        this.resetAllDailyAmounts = async function () {
            this.entireDatabase = await this.fetchAll()
            for (let object of this.entireDatabase) {
                let { value: { daily }, id } = object
                if (daily) await this.setDailyAmount(id, 0)
            }
        }




    }
}

module.exports = {
    EconomyManager
}