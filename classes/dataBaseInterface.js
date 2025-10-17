/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { QuickDB } = require('quick.db');


const database = new QuickDB({ filePath: "database/json.sqlite" })

class DataBaseInterface {
    /**
     * Handles the Communication to the Database
     * 
     */
    constructor() {

        //Add User to Database
        this.setUser = async function (userId, eMail, userName) {
            return await database.set(userId, {
                e_mail: eMail, 
                name: userName
            })
        }

        //Get Object from Database
        this.getObject = async function (key) {
            return await database.get(key)
        }

        //Change User eMail
        this.changeUserMail = async function (userId, eMail) {
            this.userData = await this.getObject(userId)
            //Set new mail
            this.userData.e_mail = eMail
            return await database.set(userId, this.userData)
        }

        //Add Shop Item to Database
        this.addShopItem = async function (type, data) {
            switch(type) {
                case "server": {
                    return await database.push("shop_items_servers", {
                        type: type,
                        data: data
                    })
                }
                default: return null
            }
        }

        //Set Shop Database
        this.setShop = async function (data) {
            return await database.set("shop_items_servers", data)
        }

        //Delete User from Database
        this.deleteUser = async function (userId) {
            return await database.delete(userId)
        }

        //Remove Shop Item from Database
        this.removeShopItem = async function (indexOfItem) {
            this.newShopData = await this.getObject("shop_items_servers")
            console.table(this.newShopData)
            if(!this.newShopData) return null
            this.newShopData.splice(indexOfItem, 1)
            console.table(this.newShopData)
            await this.setShop(this.newShopData)
        }

        //Add Value to User 
        this.addUserValue = async function (userId, key, value) {
            return await database.add(`${userId}${key}`, value)
        }

        //Remove Value from User
        this.removeUserValue = async function (userId, key, value) {
            return await database.sub(`${userId}${key}`, value)
        }

        //Set Key from User to Value
        this.setUserValue = async function (userId, key, value) {
            return await database.set(`${userId}${key}`, value)
        }

        //Retreive entire Database
        this.fetchAll = async function () {
            return await database.all()
        }

        //Set General Object
        this.setObject = async function (key, data) {
            return await database.set(key, data)
        }

        //Push General Object
        this.pushObject = async function (key, data) {
            return await database.push(key, data)
        }

        //Delete Object
        this.deleteObject = async function(key) {
            return await database.delete(key)
        }

        
    }
}

module.exports = {
    DataBaseInterface
}