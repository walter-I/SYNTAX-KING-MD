'use strict';
const { getBotName } = require('../../lib/botname');

module.exports = {
    name:        'crash',
    aliases:     ['crashwa', 'killwa'],
    description: 'Crash WhatsApp connection',
    category:    'owner',
    ownerOnly:   true,

    async execute(sock, msg, args, prefix, ctx) {
        const chatId = msg.key.remoteJid;

        if (!ctx?.isOwnerUser && !ctx?.isSudoUser) {
            const botName = getBotName();
            return await sock.sendMessage(chatId, {
                text: `╔═|〔  CRASH 〕\n║\n║ ▸ *Status* : ❌ Owner only\n║\n╚═|〔 ${botName} 〕`
            }, { quoted: msg });
        }

        try { await sock.sendMessage(chatId, { react: { text: '💥', key: msg.key } }); } catch {}

        const botName = getBotName();
        await sock.sendMessage(chatId, {
            text: [
                `╔═|〔  CRASH 〕`,
                `║`,
                `║ ▸ *Status* : 💥 Crashing WhatsApp...`,
                `║`,
                `╚═|〔 ${botName} 〕`,
            ].join('\n')
        }, { quoted: msg });

        setTimeout(() => process.exit(1), 1000);
    },
};
