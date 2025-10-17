/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const express = require('express');
const router = express.Router();
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();
const clientId = process.env.BOT_CLIENT_ID, clientSecret = process.env.SECRET

router.get('/', async ({ query }, response) => {
    const { code } = query;

    if (code) {
        try {
            oauth.tokenRequest({
                clientId: clientId,
                clientSecret: clientSecret,

                code: code,
                scope: "identify, guilds",
                grantType: "authorization_code",
                redirectUri: "http://localhost:53134/",
            }).then(async res => {
                let token = res.access_token
                let userData = await oauth.getUser(token)
                let userServers = await oauth.getUserGuilds(token)
                response.json({user: userData, servers: userServers, status: "201", oauth: res})
            }).catch(async res => {
                response.json({status: "401", oauth: res})
            })
    } catch(error) {}
    // return response.sendFile('express/dashboard/index.html', { root: '.' });
}})


module.exports = router;