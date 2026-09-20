function clockString(ms) {
    if (isNaN(ms) || ms < 0) ms = 0
    let d = Math.floor(ms / 86400000)
    let h = Math.floor(ms / 3600000) % 24
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return `${d}d ${h}h ${m}m ${s}s`
}

let handler = async (m, { conn, command, args, isOwner, isROwner, usedPrefix }) => {
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
        return m.reply(`🔴 *MODO PRIVADO ATIVADO!*\n\nO bot agora está em modo *Silencioso / Privado* (Self).\n• Nenhum usuário ou grupo receberá respostas ou downloads.\n• Parecerá offline para os outros.\n• Somente o Dono pode usar comandos.\n\nPara religar para todos: *${usedPrefix}bot on*`)
    }

    if (cmd === 'startbot' || cmd === 'ligar' || (cmd === 'bot' && (arg === 'on' || arg === '1' || arg === 'ligar' || arg === 'ativar'))) {
        if (!isOwner && !isROwner) return global.dfail('owner', m, conn)
        global.opts['self'] = false
        global.opts.self = false
        bot.self = false
        if (global.db && typeof global.db.write === 'function') {
            await global.db.write().catch(() => {})
        }
        return m.reply(`🟢 *MODO PÚBLICO ATIVADO!*\n\nO bot voltou a responder a todos os membros e grupos normalmente.`)
    }

    const isSelf = global.opts['self'] || bot.self || false
    const isRestrictGp = bot.restrictgp || false
    const isBotClone = bot.botclone || false
    const uptime = clockString(process.uptime() * 1000)
    const ramUsed = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
    const totalGroups = Object.keys(global.db.data.chats || {}).filter(j => j.endsWith('@g.us')).length
    const totalUsers = Object.keys(global.db.data.users || {}).length

    let msg = `🤖 *STATUS DA SENNA BOT*

📌 *Modo do Bot:* ${isSelf ? '🔴 *Privado (Apenas Dono)*' : '🟢 *Público (Para Todos)*'}
🛡️ *Modo Aluguel/Grupos:* ${isRestrictGp ? '🟢 *Ativado (Exige Licença)*' : '⚪ *Livre (Todos os Grupos)*'}
👥 *Sub-Bots (CloneBot):* ${isBotClone ? '🟢 *Ativado*' : '🔴 *Desativado*'}
⏱️ *Tempo Ativo:* ${uptime}
📶 *Memória RAM:* ${ramUsed} MB / 500 MB
📊 *Estatísticas:* ${totalGroups} grupos | ${totalUsers} usuários`

    if (isOwner || isROwner) {
        msg += `\n\n━━━━━━━━━━━━━━━━━━━\n🛠️ *Comandos de Controle (Dono):*
• *${usedPrefix}bot on* -> Ativa modo público
• *${usedPrefix}bot off* -> Ativa modo privado (self)
• *${usedPrefix}on restrictgp* / *${usedPrefix}off restrictgp* (Aluguel em grupos)
• *${usedPrefix}on botclone* / *${usedPrefix}off botclone* (Sub-bots)
• *${usedPrefix}gerarlicenca <tempo>* (Gera licença: ex 30d, permanente)
• *${usedPrefix}licencas* (Lista licenças pendentes)
• *${usedPrefix}licenca* (Ver licença do grupo atual)`
    }

    return m.reply(msg.trim())
}

handler.help = ['bot', 'bot on', 'bot off', 'botstatus']
handler.tags = ['main', 'owner']
handler.command = /^(bot|botstatus|statusbot|stopbot|startbot|desligar|ligar|pausar)$/i

export default handler
