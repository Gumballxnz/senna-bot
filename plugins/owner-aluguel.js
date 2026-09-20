function parseDuration(str) {
    let lower = str.toLowerCase().trim()
    if (lower === 'permanente' || lower === 'perm' || lower === 'infinito' || lower === 'inf') {
        return -1
    }
    const match = lower.match(/^(\d+)([smhda])$/)
    if (!match) return null
    const value = parseInt(match[1])
    const unit = match[2]
    switch (unit) {
        case 's': return value * 1000
        case 'm': return value * 60 * 1000
        case 'h': return value * 60 * 60 * 1000
        case 'd': return value * 24 * 60 * 60 * 1000
        case 'a': return value * 365 * 24 * 60 * 60 * 1000
        default: return null
    }
}

function formatDuration(ms) {
    if (ms === -1) return 'Permanente'
    let seconds = Math.floor((ms / 1000) % 60)
    let minutes = Math.floor((ms / (1000 * 60)) % 60)
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
    let days = Math.floor((ms / (1000 * 60 * 60 * 24)) % 365)
    let years = Math.floor(ms / (1000 * 60 * 60 * 24 * 365))

    let parts = []
    if (years > 0) parts.push(`${years}a`)
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)
    return parts.join(' ') || '0s'
}

function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const gen = (len) => {
        let res = ''
        for (let i = 0; i < len; i++) {
            res += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return res
    }
    return `SENNA-${gen(4)}-${gen(4)}-${gen(4)}`
}

let handler = async (m, { conn, args, text, usedPrefix, command, isOwner }) => {
    let chat = global.db.data.chats[m.chat]
    global.db.data.licenses = global.db.data.licenses || {}

    const groupOnlyCmds = ['aluguel', 'licenca', 'addaluguel', 'delaluguel', 'resgatar', 'ativarlicenca']
    if (groupOnlyCmds.includes(command) && !m.isGroup) {
        return m.reply(`⚠️ Este comando só pode ser utilizado dentro de um grupo!`)
    }

    if (command === 'aluguel' || command === 'licenca') {
        const botJid = conn.user?.jid || (conn.user?.id ? conn.decodeJid(conn.user.id) : '')
        const botSettings = global.db.data.settings[botJid] || {}
        const isRestrict = botSettings.restrictgp || false

        if (chat.expired === -1) {
            return m.reply(`🟢 *Status da Licença:* Permanente / Vitalícia\n📅 *Vencimento:* Nunca expira\n⏳ *Tempo restante:* Ilimitado`)
        }

        let remaining = (chat.expired || 0) - Date.now()
        if (chat.expired && chat.expired > 0 && remaining > 0) {
            let dateStr = new Date(chat.expired).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            let durationStr = formatDuration(remaining)
            return m.reply(`🟢 *Status da Licença:* Ativa\n📅 *Vence em:* ${dateStr} (Brasília)\n⏳ *Tempo restante:* ${durationStr}`)
        }

        if (chat.expired && remaining <= 0 && chat.expired !== 0) {
            return m.reply(`🔴 *Status da Licença:* Expirada!\n\n_Para renovar ou ativar uma licença, digite:_\n*${usedPrefix}resgatar SENNA-XXXX-XXXX-XXXX*\n_Ou envie o código diretamente no grupo._`)
        }

        return m.reply(`ℹ️ *Status da Licença:* Este grupo não possui licença ativa.\n📌 *Modo do Bot:* ${isRestrict ? '🔒 Exige Licença (Comandos restritos)' : '🔓 Livre para todos os grupos'}\n\n_Para ativar uma licença, use:_\n*${usedPrefix}resgatar SENNA-XXXX-XXXX-XXXX*`)
    }

    if (command === 'resgatar' || command === 'ativarlicenca') {
        let code = (args[0] || '').trim().toUpperCase()
        if (!code) return m.reply(`✳️ *Como resgatar:*\n${usedPrefix + command} SENNA-XXXX-XXXX-XXXX\n\n_Ou simplesmente envie o código diretamente no grupo._`)
        if (!global.db.data.licenses[code]) {
            return m.reply(`❌ *Licença inválida ou já utilizada!* Verifique se digitou o código corretamente.`)
        }

        let license = global.db.data.licenses[code]
        let created = typeof license === 'object' ? license.created : Date.now()
        let duration = typeof license === 'object' ? license.duration : license

        if (Date.now() - created > 24 * 60 * 60 * 1000) {
            delete global.db.data.licenses[code]
            return m.reply(`🔴 *Licença expirada!* Esta licença foi gerada há mais de 24 horas e não foi utilizada a tempo.`)
        }

        if (duration === -1) {
            chat.expired = -1
        } else {
            let currentExpired = chat.expired && chat.expired > Date.now() ? chat.expired : Date.now()
            if (chat.expired !== -1) {
                chat.expired = currentExpired + duration
            }
        }

        delete global.db.data.licenses[code]
        if (global.db && typeof global.db.write === 'function') {
            await global.db.write().catch(() => {})
        }

        let dateStr = chat.expired === -1 ? 'Nunca expira (Permanente)' : new Date(chat.expired).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        let durationStr = duration === -1 ? 'Permanente' : formatDuration(duration)

        return m.reply(`✅ *LICENÇA ATIVADA COM SUCESSO!*\n\n🔑 *Código:* ${code}\n⏳ *Duração adicionada:* ${durationStr}\n📅 *Novo vencimento:* ${dateStr}\n\nO bot agora está liberado para este grupo!`)
    }

    if (command === 'addaluguel') {
        if (!isOwner) return global.dfail('owner', m, conn)
        if (!args[0]) return m.reply(`✳️ *Como usar:*\n${usedPrefix + command} <duração>\n\n*Exemplos:*\n${usedPrefix + command} 30d\n${usedPrefix + command} permanente\n\n*Sufixos:* s, m, h, d, a ou "permanente"`)

        let duration = parseDuration(args[0])
        if (duration === null) return m.reply(`❌ *Duração inválida!* Use números seguidos por s, m, h, d, a ou digite "permanente".`)

        if (duration === -1) {
            chat.expired = -1
        } else {
            let currentExpired = chat.expired && chat.expired > Date.now() ? chat.expired : Date.now()
            if (chat.expired === -1) {

            } else {
                chat.expired = currentExpired + duration
            }
        }

        let dateStr = chat.expired === -1 ? 'Nunca expira' : new Date(chat.expired).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        let durationStr = duration === -1 ? 'permanente' : args[0]

        m.reply(`✅ *Aluguel adicionado/estendido com sucesso!*\n📅 *Novo vencimento:* ${dateStr}\n⏳ *Adicionado:* ${durationStr}`)
    }

    if (command === 'delaluguel') {
        if (!isOwner) return global.dfail('owner', m, conn)
        chat.expired = 0
        m.reply(`✅ *Aluguel removido deste grupo!*`)
    }

    if (command === 'gerarlicenca' || command === 'genkey') {
        if (!isOwner) return global.dfail('owner', m, conn)
        if (!args[0]) return m.reply(`✳️ *Como usar:*\n${usedPrefix + command} <duração>\n\n*Exemplos:*\n${usedPrefix + command} 30d\n${usedPrefix + command} permanente`)

        let duration = parseDuration(args[0])
        if (duration === null) return m.reply(`❌ *Duração inválida!* Use números seguidos por s, m, h, d, a ou digite "permanente".`)

        let key = generateLicenseKey()
        global.db.data.licenses[key] = {
            duration: duration,
            created: Date.now()
        }

        let durLabel = duration === -1 ? 'permanente' : args[0]
        m.reply(`🔑 *LICENÇA GERADA COM SUCESSO!*\n\n*Código:* \`${key}\`\n*Duração:* ${durLabel}\n*Expira para resgate:* em 24 horas\n\n_Envie esse código no grupo que deseja ativar o bot._`)
    }

    if (command === 'licencas' || command === 'listkeys') {
        if (!isOwner) return global.dfail('owner', m, conn)
        let keys = Object.keys(global.db.data.licenses)

        keys = keys.filter(key => {
            let lic = global.db.data.licenses[key]
            let created = typeof lic === 'object' ? lic.created : Date.now()
            if (Date.now() - created > 24 * 60 * 60 * 1000) {
                delete global.db.data.licenses[key]
                return false
            }
            return true
        })

        if (keys.length === 0) return m.reply(`ℹ️ Não há licenças geradas e válidas no momento.`)

        let text = `🔑 *LICENÇAS DISPONÍVEIS:* (Total: ${keys.length})\n\n`
        keys.forEach((key, index) => {
            let lic = global.db.data.licenses[key]
            let dur = typeof lic === 'object' ? lic.duration : lic
            let created = typeof lic === 'object' ? lic.created : Date.now()
            let timeRemaining = Math.max(0, (24 * 60 * 60 * 1000) - (Date.now() - created))

            let durLabel = dur === -1 ? 'Permanente' : formatDuration(dur)
            text += `*${index + 1}.* \`${key}\` (${durLabel})\n`
            text += `   ⏳ *Expira para resgate em:* ${formatDuration(timeRemaining)}\n\n`
        })
        m.reply(text.trim())
    }

    if (command === 'listargrupos' || command === 'grupos') {
        if (!isOwner) return global.dfail('owner', m, conn)
        let chats = Object.keys(global.db.data.chats).filter(jid => jid.endsWith('@g.us'))
        if (chats.length === 0) return m.reply(`ℹ️ Não há registros de grupos no banco de dados.`)

        let text = `👥 *GRUPOS NO BANCO DE DADOS:* (Total: ${chats.length})\n\n`
        chats.forEach((jid, index) => {
            let chat = global.db.data.chats[jid]
            let exp = chat.expired
            let status = ''
            if (exp === -1) {
                status = 'Permanente'
            } else if (!exp || exp === 0) {
                status = 'Sem aluguel'
            } else if (Date.now() > exp) {
                status = 'Expirado'
            } else {
                status = `Ativo (Restam ${formatDuration(exp - Date.now())})`
            }
            text += `${index + 1}. *Nome:* ${chat.name || 'Desconhecido'}\n   *JID:* \`${jid}\`\n   *Status:* ${status}\n\n`
        })
        m.reply(text.trim())
    }
}

handler.help = ['aluguel', 'licenca', 'resgatar <código>', 'gerarlicenca <duração>', 'licencas', 'listargrupos']
handler.tags = ['owner', 'group']
handler.command = ['aluguel', 'licenca', 'addaluguel', 'delaluguel', 'gerarlicenca', 'genkey', 'licencas', 'listkeys', 'listargrupos', 'grupos', 'resgatar', 'ativarlicenca']

export default handler
