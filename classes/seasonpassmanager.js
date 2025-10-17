/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const Canvas = require("@napi-rs/canvas");
const { request } = require("undici");
class SeasonPassManager {
    /**
     * Manager for the Season Pass
     * 
     */
    constructor() {


        /**
         * 
         * @param {*} modifier Override Modifier to generate either extremely rewarding or unrewarding items || Set to 1 if normal values should appear
         * @param {*} level The current Level ( 0-50 ) that this random item is meant for
         * @returns An Array containing an object with a type and an amount
         */
        this.generateRandomSeasonPassItem = async function (modifier, level) {
            let chanceList = [
                { type: "xp", chance: 30 },
                { type: "coins", chance: 70 }
            ]

            let item = function () {
                let rnd = Math.random()
                let acc = 0
                for (let i = 0, r; r = chanceList[i]; i++) {
                    acc += r.chance / 100
                    if (rnd < acc) return r.type 
                }
                return "empty"
            }

            if (item == "xp") {
                //Random Bonus depending on the level 
                return [
                    { type: "xp", amount: (Math.floor(Math.random() * 20) * (level / 2)) * modifier }
                ]
            }

            if (item == "coins") {
                return [
                    { type: "coins", amount: (Math.floor(Math.random() * 10) * (level / 2)) * modifier }
                ]
            }
        }


        /**
         * 
         * @param {*} type Type of the PassItem
         * @param {*} amount Amount of "coins"...
         * @returns An Image Buffer
         */
        this.generateSeasonPassImage = async function (type, amount) {

            let canvas = Canvas.createCanvas(50, 150)
            let context = canvas.getContext("2d")
            //Gradient
            let gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
            gradient.addColorStop(0, "#ECC046"), gradient.addColorStop(1, "#F5F7ED"), context.fillStyle = gradient, context.fillRect(0, 0, canvas.width, canvas.height)
            //Stroke
            context.lineWidth = 10, context.strokeStyle = "#DC7726", context.strokeRect(0, 0, canvas.width, canvas.height)
            //Font
            context.font = "15px", context.fillStyle = "#DC7726"
            //Load Image
            context.drawImage(await Canvas.loadImage(`files/${type}.png`), 25, 110, 25, 25)
            //Text
            context.fillText(String(amount), 25, 75)

            return canvas.toBuffer("image/png")
        }


        //TODO + /seasonpass command ( paged season pass with a "claim all" button)
        /**
         * 
         * @param {*} days Amount of SeasonPassDays to generate ( Default of 30 )
         */
        this.generateSeasonPass = async function (days = 30) {
            let seasonPass = []
            for (let i = 0; i < days; i++) {
                let modifier = Math.floor(Math.random() * 2) + 1
                let item = await this.generateRandomSeasonPassItem(modifier, i)
                seasonPass.push({
                    date: new Date().getTime() + (i * 86400000),
                    items: item
                })
            }
            return seasonPass
        
        }

        this.resetPlayerXp = async function (id) {
            //Reset Players xp to 0
              

        }

        this.grantPlayerXp = async function (amount) {
            //Give Player xp
        
        }

        this.getPlayerXp = async function (id) {
            //Get Players xp
        
        
        }

        this.convertXpToLevel = async function (xp) {
            //Convert xp to level
        
        
        }

        this.addPlayerLevelComplections = async function (id, amount) {

        }

        this.resetPlayerLevelComplections = async function (id) {
            
        }
    }
}

module.exports = {
    SeasonPassManager
}