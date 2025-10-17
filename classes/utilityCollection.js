/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

let { generatePassword } = require("./passwordGenerator");
const { glob } = require("glob");


class UtilityCollection {
    /**
     * Utility Collection - Some Random but important used Methods are stores here
     *
     */
    constructor() {
        //Generate Password
        this.generatePassword = async function (length) {
            return generatePassword(length)
        }

        //Get random Integer
        this.getRandomInteger = async function (max) {
            return Math.floor(Math.random() * max)
        }

        //Get Canvas Font Size
        this.getCanvasFontSize = async function (canvas, text, fontStyle, baseFontSize, canvasOffset) {
            this.canvasContext = canvas.getContext('2d')
            do { 
                this.canvasContext.font = `${(baseFontSize -= 1)}px ${fontStyle}`
               } while (this.canvasContext.measureText(text).width > canvas.width - canvasOffset)
        }

        //Round up Number
        this.roundUp = async function (number, precision) {
            this.roundPrecision = Math.pow(10, precision)
            return Math.ceil(number * precision) / precision
        }

        //Load Javascript Files and delete their require Cache
        this.loadFiles = async function (directoryName) {
            this.files = await glob(`${process.cwd().replace(/\\/g, "/")}/${directoryName}/**/*.js`)
            this.files.forEach((file) => delete require.cache[require.resolve(file)])
            return this.files
        }
    }
}

module.exports = {
    UtilityCollection
}