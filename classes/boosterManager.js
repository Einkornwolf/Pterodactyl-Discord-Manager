/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { DataBaseInterface } = require("./dataBaseInterface")

class BoosterManager extends DataBaseInterface {
    constructor() {
        super()
        //Get Users Booster Status
        this.getBoosterStatus = async function (userId) {
            this.userData = await this.getObject(userId)
            let{ booster } = this.userData
            return booster
        }

        //Set Users Booster Status
        this.setBoosterStatus = async function (userId, type = new Boolean) {
            return await this.setUserValue(userId, ".booster", type)
        }
    }
}

module.exports = {
    BoosterManager
}