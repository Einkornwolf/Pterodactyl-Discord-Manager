/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const fs = require("fs");
const path = require("path");

class EmojiManager {
    /**
     *
     * Provides a simple way to retreive either custom emojis via id or unicode based emojis if an id is not present
     *
     */

    constructor() {
        this.getEmoji = async function (key) {
            const txt = await fs.promises.readFile(`translations/emojis.json`);
            const json = JSON.parse(txt);
            const entry = json[key];
            if (!entry) return null;
            if (entry.id && String(entry.id).trim().length) return entry.id;
            return entry.emoji ?? null;
        }

        //Emoji parser
        this.parseEmoji = function (raw) {
            if (!raw) return null;
            if (typeof raw === "string") {
                const m = raw.match(/<a?:([^:>]+):(\d+)>/);
                if (m) return { id: m[2], name: m[1], animated: raw.startsWith("<a:") };
                return raw; // Unicode
            } else if (typeof raw === "object" && raw.id) {
                return { id: raw.id, name: raw.name || undefined, animated: !!raw.animated };
            }
            return null;
        }
    }
}

module.exports = {
    EmojiManager
}
