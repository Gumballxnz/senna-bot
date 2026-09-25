let handler = async (m, { conn, command, args, isOwner, isROwner }) => {
    const botJid = conn.user?.jid || (conn.user?.id ? conn.decodeJid(conn.user.id) : '')
    if (botJid && !global.db.data.settings[botJid]) {
        global.db.data.settings[botJid] = {}
    }
    const bot = botJid ? global.db.data.settings[botJid] : {}

    const cmd = command.toLowerCase()
    const arg = (args[0] || '').toLowerCase()

    if (cmd === 'stopbot' || cmd === 'desligar' || cmd === 'pausar' || (cmd === 'bot' && (arg === 'off' || arg === '0' || arg === 'desligar' || arg === 'pausar'))) {
        if (!isOwner && !isROwner) return global.dfail('owner', m, conn)
        global.opts['self'] = true
        global.opts.self = true
        bot.self = true
        if (global.db && typeof global.db.write === 'function') {
            await global.db.write().catch(() => {})
        }
        return m.reply('off')
    }

    if (cmd === 'startbot' || cmd === 'ligar' || (cmd === 'bot' && (arg === 'on' || arg === '1' || arg === 'ligar' || arg === 'ativar'))) {
        if (!isOwner && !isROwner) return global.dfail('owner', m, conn)
        global.opts['self'] = false
        global.opts.self = false
        bot.self = false
        if (global.db && typeof global.db.write === 'function') {
            await global.db.write().catch(() => {})
        }
        return m.reply('on')
    }

    const isSelf = global.opts['self'] || bot.self || false
    return m.reply(isSelf ? 'off' : 'on')
}

handler.help = ['bot', 'bot on', 'bot off']
handler.tags = ['main', 'owner']
handler.command = /^(bot|botstatus|statusbot|stopbot|startbot|desligar|ligar|pausar)$/i

export default handler
