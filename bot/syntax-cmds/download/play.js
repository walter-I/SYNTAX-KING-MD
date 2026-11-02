const yts = require("yt-search");
const { getBotName } = require("../../lib/botname");
const youtubeCommands = require("./youtube");

function trunc(_0x51d347, _0x3ebbc4 = 38) {
  if (_0x51d347 && _0x51d347.length > _0x3ebbc4) {
    return _0x51d347.slice(0, _0x3ebbc4 - 1) + "…";
  } else {
    return _0x51d347 || "";
  }
}

module.exports = {
  name: "play",
  aliases: ["music", "song", "playsong"],
  description: "Search and play a song from YouTube (128kbps MP3)",
  category: "download",
  async execute(_0x257fb7, _0x38eb72, _0x58d407, _0x45e1a4, _0x3b2277) {
    const _0x227982 = _0x38eb72.key.remoteJid;
    const _0x48a4b6 = getBotName();
    const _0x5aee42 = _0x58d407.join(" ").trim();
    
    if (!_0x5aee42) {
      return _0x257fb7.sendMessage(_0x227982, {
        text: ["╔═|〔  PLAY MUSIC 〕", "║", "║ ▸ *Usage*   : " + _0x45e1a4 + "play <song name>", "║ ▸ *Example* : " + _0x45e1a4 + "play Alan Walker Faded", "║", "╚═|〔 " + _0x48a4b6 + " 〕"].join("\n")
      }, {
        quoted: _0x38eb72
      });
    }
    
    try {
      await _0x257fb7.sendMessage(_0x227982, {
        react: {
          text: "🎵",
          key: _0x38eb72.key
        }
      });
      
      let url = _0x5aee42;
      
      if (!/youtu\.?be|youtube\.com/.test(_0x5aee42)) {
        const search = await yts(_0x5aee42);
        
        if (!search.videos?.length) {
          throw new Error("No search results");
        }
        
        url = search.videos[0].url;
      }
      
      const audioCommand = youtubeCommands.find(command => command.name === "yta");
      if (!audioCommand) {
        throw new Error("YouTube audio command is unavailable");
      }
      return await audioCommand.execute(_0x257fb7, _0x38eb72, [url], _0x45e1a4, _0x3b2277);
      
    } catch (_0x149386) {
      await _0x257fb7.sendMessage(
        _0x227982,
        {
          text: [
            "╔═|〔  PLAY MUSIC 〕",
            "║",
            "║ ▸ *Query*  : " + trunc(_0x5aee42),
            "║ ▸ *Status* : ❌ Failed",
            "║ ▸ *Reason* : " + _0x149386.message,
            "║",
            "╚═|〔 " + _0x48a4b6 + " 〕"
          ].join("\n")
        },
        {
          quoted: _0x38eb72
        }
      );
    }
  }
};
