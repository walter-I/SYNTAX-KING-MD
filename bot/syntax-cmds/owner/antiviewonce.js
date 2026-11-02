'use strict';

const fs   = require('fs');
const path = require('path');
const { getBotName } = require('../../lib/botname');

const CONFIG_FILE = path.join(__dirname, '../../data/antiviewonce/config.json');

function loadConfig() {
    if (typeof globalThis._loadAntiViewOnceConfig === 'function') {
        return globalThis._loadAntiViewOnceConfig();
    }
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        throw error;
    }
}

function saveConfig(cfg) {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

module.exports = {
    name:        'antiviewonce',
    aliases:     ['av', 'antiview', 'antiviewonce'],
    description: 'Enable/disable anti-viewonce (owner only)',
    category:    'owner',
    ownerOnly:   true,

    async execute(sock, msg, args, prefix, ctx) {
        const chatId = msg.key.remoteJid;
        const name   = getBotName();
        try { await sock.sendMessage(chatId, { react: { text: '👁️', key: msg.key } }); } catch {}

        const cfg   = loadConfig();
        const sub   = (args[0] || '').toLowerCase();

        if (!sub || sub === 'status') {
            const statusLines = cfg.gc && cfg.pm
                ? [`║ ▸ *Groups* : ${cfg.gc.enabled ? '✅ ON' : '❌ OFF'}`, `║ ▸ *DMs*    : ${cfg.pm.enabled ? '✅ ON' : '❌ OFF'}`]
                : [`║ ▸ *Status* : ${cfg.enabled ? '✅ ON' : '❌ OFF'}`];
            return sock.sendMessage(chatId, {
                text: [
                    `╔═|〔  ANTI VIEWONCE 〕`,
                    `║`,
                    ...statusLines,
                    `║ ▸ *Delivery* : privately to sender`,
                    `║`,
                    `║ ▸ *Usage*`,
                    `║   ${prefix}av on/off`,
                    `║`,
                    `╚═|〔 ${name} 〕`
                ].join('\n')
            }, { quoted: msg });
        }

        if (sub === 'on' || sub === 'off') {
            cfg.enabled = sub === 'on';
            if (cfg.gc && typeof cfg.gc === 'object') cfg.gc.enabled = cfg.enabled;
            if (cfg.pm && typeof cfg.pm === 'object') cfg.pm.enabled = cfg.enabled;
            saveConfig(cfg);
            return sock.sendMessage(chatId, {
                text: `╔═|〔  ANTI VIEWONCE 〕\n║\n║ ▸ *Status* : ${cfg.enabled ? '✅ Enabled' : '❌ Disabled'}\n║\n╚═|〔 ${name} 〕`
            }, { quoted: msg });
        }

        await sock.sendMessage(chatId, {
            text: `╔═|〔  ANTI VIEWONCE 〕\n║\n║ ▸ *Usage* : ${prefix}av on | off\n║ ▸ *Delivery* : privately to the sender\n║\n╚═|〔 ${name} 〕`
        }, { quoted: msg });
    }
};
