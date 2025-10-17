 # Pterodactyl Discord Manager

## Overview

**Pterodactyl Discord Manager** is a Discord bot that integrates with the **Pterodactyl Panel API**, allowing users to **create and manage their own servers and accounts** directly from Discord.  

It includes the following features:
- **Virtual currency system** with a customizable server shop  
- **Mini-games** to earn coins  
- **Server management and runtime control system**  
- **Shop management tools** for administrators  
- **Coin leaderboard**  
- **Giftcode system**
- **Administrative Tools**

Currently supports **six languages**:  
**German (de-DE)**, **English (en-US)**,**Polish (pl-PL)**,**Spanish (es-ES)**,**Dutch (nl-NL)** and **French (fr-FR)** — selectable via the `/language` command.

---

## Download

Clone or download this repository to get started:

```bash
git clone https://github.com/Einkornwolf/Pterodactyl-Discord-Manager.git
```

---

## Installation

1. **Create a configuration file** named `config.env`.

2. **Copy the following template** into the file and fill it out according to your setup:

```env
BOT_TOKEN=""
BOT_CLIENT_ID=""
# Server ID to restrict coin earning to one specific Discord server.
BOT_SINGLE_SERVER_ID=""

PTERODACTYL_API_KEY=""
PTERODACTYL_ACCOUNT_API_KEY=""
# URL of your Pterodactyl panel (e.g. https://panel.example.com)
PTERODACTYL_API_URL=""

# Number of days before suspended servers are deleted.
DELETION_OFFSET=2

# Price adjustment factor for server renewals.
# Use 0–1 for a discount or >1 for a price increase.
PRICE_OFFSET=0.75

# Discord user IDs allowed to manage coins and the shop (comma-separated list).
ADMIN_LIST=[]

#Set the Text which should appear in (most) embed footers 
FOOTER_TEXT = "© Einkornwolf 2025"

# Default language ("en-US", "de-DE", "pl-PL", "es-ES", "nl-NL or "fr-FR").
DEFAULT_LANGUAGE="en-US"

# Express server port
PORT="53134"

# OAuth2 secret
SECRET=""

# Partner configuration (for internal testing only)
PARTNER_CHANNEL=""
PARTNER_TEXT=""
```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the bot:**
   ```bash
   node bot.js
   ```
5. (Optional) **Configure Emojis and/or Language:**
   **Navigate to** `translations/emojis.json` and either configure the Standard Emojis by **editing them directly in the File** 
   or use **custom Emojis** by filling the **ID Field**. For Example:
   ```json
   "emoji_play": { "id": "<:emojiName:12345677>", "emoji": "▶️"},
   ```
   For **animated Emojis:**
   ```json
   "emoji_play": { "id": "<a:emojiName:12345677>", "emoji": "▶️"},
   ```
   
---

## Notes

- This bot is provided **as-is**, without any warranty or guarantee.  
- **Discord.js updates** may break functionality at any time.  
  If that happens, you may need to wait for an update or patch it yourself.  
- For questions or support:
  - Open a **GitHub issue**, or  
  - Contact me on Discord: **Einkornwolf**

---

## License

This project is licensed under the  
**Custom Non-Commercial Copyleft License (CNCCL)**.  

### Key Terms:
- **Private and non-commercial use** is permitted.  
- **Modification and redistribution** are allowed **only under the same license**.  
- **All changes or derivative works** must also be **publicly released**.  
- **Commercial use** of any kind is **strictly prohibited**.  
- **Copyright and license notices must remain intact** in all files.  
- The software is provided **without warranty or liability** of any kind.

See the [LICENSE](./LICENSE) file for full license text.

---

## Copyright

© 2025 Finn Wolf 
All rights reserved under the terms of the **Custom Non-Commercial Copyleft License (CNCCL)**.  

If you plan to build on this project, feel free to reach out — I’m always interested in seeing what others create with it.

Additional Notice: There are some people out there using my Code and my Creation while portraying it as their own (e.g. "Next Systems" on Discord). If you notice or see someone abusing this Code please notify me.
