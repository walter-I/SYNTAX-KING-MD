<div align="center">

  <img src="https://raw.githubusercontent.com/yourusername/SYNTAX-KING-MD/main/assets/xd-logo.jpg" width="180" style="border-radius:16px;" />

  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,2,5,30&height=120&section=header&text=SYNTAX-KING-MD&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=WhatsApp%20Bot%20v1.2.0&descAlignY=60&descSize=18" width="100%"/>

  <img src="https://img.shields.io/badge/version-1.2.0-blueviolet?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Commands-255+-25D366?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  <img src="https://img.shields.io/badge/Made%20by-Syntax_king-FF6B6B?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge"/>

  <br><br>

  <b>A powerful, free, open-source WhatsApp bot with 255+ commands</b><br>
  <i>AI · Games · Utility · Group Management · Media · Search · and more</i>

  <br><br>

  ## 🔑 SESSION & SETUP

  👉 Get your Session ID here:  
  <a href="https://example.com/session-generator/?utm_source=chatgpt.com">
    <img src="https://img.shields.io/badge/SESSION-GENERATOR-blue?style=for-the-badge&logo=render&logoColor=white"/>
  </a>

  <br><br>

  ## 🎵 YOUTUBE DOWNLOADS

  The `.song`, `.yta`, and `.video` commands use yt-dlp as a fallback when a download API is unavailable. The launcher installs the pinned bgutil PO-token plugin. On the same Linux VPS as the bot, start the provider from the repository root:

  ```sh
  docker compose -f deploy/bgutil/docker-compose.yml up -d
  ```

  The Compose file binds the provider to `127.0.0.1:4416` only; do not change this to `0.0.0.0` or publish the unauthenticated provider to the public internet. Add these settings to the bot's root `.env` and restart the bot:

  ```env
  YOUTUBE_POT_PROVIDER_URL=http://127.0.0.1:4416
  YT_DLP_JS_RUNTIME=/path/to/node-22-or-newer
  ```

  `YT_DLP_JS_RUNTIME` must point to a Node.js 22+ executable for yt-dlp's YouTube JavaScript challenges. The bot itself can continue using its existing Node.js version. Check the service with `curl http://127.0.0.1:4416/ping`; the provider image uses Node.js 22+ and is pinned to 2.0.2 to match the installed plugin. PO tokens may not resolve IP-based YouTube restrictions, so HTTP 403 can still occur.

  <br><br>

  ## 🚀 DEPLOY SYNTAX-KING-MD

  <a href="https://dashboard.heroku.com/new?template=https://github.com/yourusername/SYNTAX-KING-MD">
    <img src="https://img.shields.io/badge/DEPLOY%20TO-HEROKU-6762A6?style=for-the-badge&logo=heroku&logoColor=white"/>
  </a>

  <br><br>

  <a href="https://render.com/">
    <img src="https://img.shields.io/badge/DEPLOY%20TO-RENDER-000000?style=for-the-badge&logo=render&logoColor=white"/>
  </a>

  <br><br>

  <a href="https://dashboard.katabump.com/auth/login#google">
    <img src="https://img.shields.io/badge/DEPLOY%20TO-KATABUMP-FF6600?style=for-the-badge&logo=googlechrome&logoColor=white"/>
  </a>

  <br><br>

  <a href="https://bothosting.net/">
    <img src="https://img.shields.io/badge/DEPLOY%20TO-BOT%20HOSTING-1ABC9C?style=for-the-badge&logo=server&logoColor=white"/>
  </a>

  <br><br>

  <a href="https://railway.app/new">
    <img src="https://img.shields.io/badge/DEPLOY%20TO-RAILWAY-0B0D0E?style=for-the-badge&logo=railway&logoColor=white"/>
  </a>

  <br><br>

  <a href="https://fly.io/">
    <img src="https://img.shields.io/badge/DEPLOY%20TO-FLY.IO-8B5CF6?style=for-the-badge&logo=flydotio&logoColor=white"/>
  </a>

  <br><br>

  ## 🔗 IMPORTANT LINKS

  📡 Support Channel:  
  <a href="https://t.me/+AimiJWPsKO9kOTQ0">
    <img src="https://img.shields.io/badge/TELEGRAM-CHANNEL-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white"/>
  </a>

  <br><br>

  📢 WhatsApp Channel:  
<a href=" https://whatsapp.com/channel/0029VbDLKgLAO7RKem8cAn1D">
    <img src="https://img.shields.io/badge/WHATSAPP-CHANNEL-25D366?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  </a>

  <br><br>

  💬 WhatsApp Group:  
  <a href="https://chat.whatsapp.com/LwvhCXPsNJp3osuBsi5ctm?s=cl&p=a&ilr=1">
    <img src="https://img.shields.io/badge/WHATSAPP-GROUP-25D366?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  </a>

  <br><br>

  🤖 WhatsApp Chat:  
  <a href="https://wa.me/254768266922">
    <img src="https://img.shields.io/badge/WHATSAPP-CHAT-128C7E?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  </a>

</div>
