/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { DataBaseInterface } = require("./dataBaseInterface")

class CacheManager extends DataBaseInterface {
    constructor() {
        super()

        //Cache Data
        this.cacheData = async function (userId, data) {
            return await this.setObject(`${userId}Cache`, data)
        }

        //Get Cached Data
        this.getCachedData = async function (userId) {
            return await this.getObject(`${userId}Cache`)
        }

        //Clear Cache
        this.clearCache = async function (userId) {
            return await this.deleteObject(`${userId}Cache`)
        }
    }
}


module.exports = {
    CacheManager
}