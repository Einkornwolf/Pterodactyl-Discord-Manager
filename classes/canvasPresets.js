/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const Canvas = require("@napi-rs/canvas");
const { request } = require("undici");
const { AttachmentBuilder, UserPremiumType } = require("discord.js")
const { UtilityCollection } = require("./utilityCollection")
const utility = new UtilityCollection()

class CanvasPreset {

    /**
     * 
     * Canvas Presets / Builder for simpler canvas usage
     * 
     */

    constructor(user) {


        this.errorCanvas = async function (topText, bottomText) {
            //Canvas
            let canvas = Canvas.createCanvas(700, 300), context = canvas.getContext("2d")
            //Gradient
            let gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
            gradient.addColorStop(0, "#ECC046"), gradient.addColorStop(1, "#F5F7ED"), context.fillStyle = gradient, context.fillRect(0, 0, canvas.width, canvas.height)
            //Stroke
            context.lineWidth = 10, context.strokeStyle = "#DC7726", context.strokeRect(0, 0, canvas.width, canvas.height)
            //Font
            context.font = "50px", context.fillStyle = "#DC7726"
            //Headline
            context.fillText(`${topText}`, 200, 85)
            //Text Font
            let canvasText = `${bottomText}`;
            context.font = "35px", context.fillStyle = "#DC7726"
            let lines = bottomText.split("\n")
            for(let i = 0; i < lines.length; i++) {
                context.fillText(lines[i], 100, 200 + (i * 35))
            }
            //Clip around next Object
            context.beginPath(), context.arc(75, 75, 50, 0, Math.PI * 2, true), context.closePath(), context.clip()
            //Add User Avatar
            let { body } = await request(user.displayAvatarURL({ extension: "jpg" })), avatar = await Canvas.loadImage(await body.arrayBuffer())
            context.drawImage(avatar, 25, 25, 100, 100), context.stroke()
            let attachment = new AttachmentBuilder(await canvas.toBuffer("image/png"), { name: "canvas.png" })
            return attachment
        }

        this.balanceCanvas = async function (topText, bottomText) {

        }

        this.explanationCanvas = async function (topText, longText) {

        }

    }
}

module.exports = {
    CanvasPreset
}