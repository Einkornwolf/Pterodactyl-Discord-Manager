/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { DataBaseInterface } = require("./dataBaseInterface");

class GiftCodeManager extends DataBaseInterface {
    constructor() {
        super()

        //Create Gift Code
        this.createGiftCode = async function(code, value, singleUse) {
            let giftObject = {
                "code": code,
                "value": value,
                "singleUse": singleUse,
                "usedBy": []
            }
            await this.pushObject("gift_codes_list", giftObject)
        }

        //Delete Gift Code
        this.deleteGiftCode = async function(code) {
            //Get all codes
            this.giftCodes = await this.getObject("gift_codes_list")
            //Get Index of code to be deleted
            this.findCode = this.giftCodes.find((obj) => obj.code == code)
            if(this.findCode == undefined) return false
            this.giftIndex = this.giftCodes.indexOf(this.findCode)
            //Delete item from list and set db
            this.giftCodes.splice(this.giftIndex, 1)
            await this.setObject("gift_codes_list", this.giftCodes)
            return true
        }

        //Add User to used List
        this.addUsed = async function(userId, code) {
            //Get all Codes
            this.giftCodes = await this.getObject("gift_codes_list")
            //Get Index
            this.findCode = this.giftCodes.find((obj) => obj.code == code)
            this.giftIndex = this.giftCodes.indexOf(this.findCode)
            //usedBy Array
            let usedBy = this.giftCodes[this.giftIndex].usedBy

            //Append
            usedBy.push(userId)

            //Create new Code Object
            let giftCodeObject = {
                "code": this.giftCodes[this.giftIndex].code,
                "value": this.giftCodes[this.giftIndex].value,
                "singleUse": this.giftCodes[this.giftIndex].singleUse,
                "usedBy": usedBy
            }

            this.giftCodes[this.giftIndex] = giftCodeObject

            this.setObject("gift_codes_list", this.giftCodes)
        }
    }
}

module.exports = {
    GiftCodeManager
}