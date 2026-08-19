// Plugin para controlar se o bot responde ao público ou fica 100% desligado/privado
let handler = async (m, { conn, command, args, isOwner, isROwner, usedPrefix }) => {
    if (!isOwner && !isROwner) return

    const botJid = conn.user?.jid || (conn.user?.id ? conn.decodeJid(conn.user.id) : '')
    if (botJid && !global.db.data.settings[botJid]) {
        global.db.data.settings[botJid] = {}
    }
    const bot = botJid ? global.db.data.settings[botJid] : {}

    const cmd = command.toLowerCase()
    const arg = (args[0] || '').toLowerCase()

    // Status atual
    if (cmd === 'botstatus' || cmd === 'statusbot') {
        const isSelf = global.opts['self'] || bot.self || false
        return m.reply(`🤖 *STATUS ATUAL DO BOT:*\n\n📌 *Modo:* ${isSelf ? '🔴 *DESLIGADO / PRIVADO (Apenas Dono)*' : '🟢 *LIGADO / PÚBLICO (Todos os usuários)*'}\n\n*Comandos rápidos:*\n• *${usedPrefix}bot off* -> Desliga o bot para todos (invisível)\n• *${usedPrefix}bot on* -> Liga o bot para todos`)
    }

    // Desligar o bot para o público (Modo Privado / Silencioso)
    if (cmd === 'stopbot' || cmd === 'desligar' || cmd === 'pausar' || (cmd === 'bot' && (arg === 'off' || arg === '0' || arg === 'desligar' || arg === 'pausar'))) {
        global.opts['self'] = true
        global.opts.self = true
        bot.self = true
        if (global.db && typeof global.db.write === 'function') {
            await global.db.write().catch(() => {})
        }
        return m.reply(`🔴 *BOT DESLIGADO PARA O PÚBLICO!*\n\nO bot agora está em modo *Silencioso / Privado*.\n• Nenhum usuário ou grupo receberá respostas, reações ou downloads.\n• Parecerá 100% offline para os outros.\n• Somente você (Dono) pode usar comandos.\n\nPara religar quando quiser, digite: *${usedPrefix}bot on*`)
    }

    // Ligar o bot para o público
    if (cmd === 'startbot' || cmd === 'ligar' || (cmd === 'bot' && (arg === 'on' || arg === '1' || arg === 'ligar' || arg === 'ativar'))) {
        global.opts['self'] = false
        global.opts.self = false
        bot.self = false
        if (global.db && typeof global.db.write === 'function') {
            await global.db.write().catch(() => {})
        }
        return m.reply(`🟢 *BOT LIGADO PARA O PÚBLICO!*\n\nO bot voltou a responder a todos os membros e grupos normalmente.`)
    }

    // Se só digitou .bot sem argumentos
    const isSelf = global.opts['self'] || bot.self || false
    return m.reply(`🤖 *CONTROLE DO BOT:*\n\n• *${usedPrefix}bot off* -> Desliga o bot para todos\n• *${usedPrefix}bot on* -> Liga o bot para todos\n• *${usedPrefix}botstatus* -> Ver status atual\n\n📌 *Status:* ${isSelf ? '🔴 Desligado (Privado)' : '🟢 Ligado (Público)'}`)
}

handler.help = ['bot on', 'bot off', 'botstatus', 'stopbot']
handler.tags = ['owner']
handler.command = /^(bot|stopbot|startbot|desligar|ligar|pausar|botstatus|statusbot)$/i
handler.owner = true

export default handler
