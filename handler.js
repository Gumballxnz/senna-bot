import { smsg } from './lib/simple.js'
import { format } from 'util' 
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'

/**
 * @type {import('@whiskeysockets/baileys')}
 */
const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)

const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))
 
/**
 * Handle messages upsert
 * @param {import('@whiskeysockets/baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate 
 */
export async function handler(chatUpdate) {

     let settings = {}

    this.msgqueque = this.msgqueque || []


    if (!chatUpdate)
        return
    //this.pushMessage(chatUpdate.messages).catch(console.error)

    // Confirmação de Leitura Automática (Tique Azul)
    if (chatUpdate.messages) {
        for (const message of chatUpdate.messages) {
            if (message.key && !message.key.fromMe) {
                try {
                    if (typeof this.readMessages === 'function') {
                        await this.readMessages([message.key]).catch(() => {})
                    } else if (typeof this.chatRead === 'function') {
                        await this.chatRead(message.key.remoteJid, message.key.participant || undefined, message.key.id).catch(() => {})
                    }
                } catch (e) {
                    console.error('Erro ao marcar mensagem como lida:', e)
                }
            }
        }
    }

    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m)
        return
    if (global.db.data == null)
        await global.loadDatabase()

//--
global.db.data ||= {}
global.db.data.users ||= {}
global.db.data.chats ||= {}
global.db.data.stats ||= {} 
global.db.data.settings ||= {}
global.db.data.statsMsg ||= {} //contador de mensaje por grupo
global.db.data.licenses ||= {}
    

    
    try {
        m = smsg(this, m) || m
        if (!m)
            return
        m.exp = 0
        m.coin = 0
        m.diamond = false

        try {
    // =============================
    // USER INIT
    // =============================

    const userDefaults = {
        exp: 0,
        coin: 0,
        diamond: 500,
        bank: 0,
        registered: false,
        name: m.name,
        age: -1,
        regTime: -1,
        afk: -1,
        afkReason: '',
        banned: false,

        level: 0,
        role: 'Novato',
        autolevelup: false,
    }

    if (!global.db.data.users[m.sender])
        global.db.data.users[m.sender] = {}

    let user = global.db.data.users[m.sender]

    for (let key in userDefaults) {
        if (!(key in user) || user[key] === undefined || user[key] === null) {
            user[key] = userDefaults[key]
        }
    }

    const chatDefaults = {
        isBanned: false,
        welcome: false,
        detect: false,
        sWelcome: '',
        sBye: '',
        sPromote: '',
        sDemote: '',
        antiLink: false,
        nsfw: false,
        rules: '',
        antiBotClone: false,
        autodl: false,
        expired: 0
    }

    if (!global.db.data.chats[m.chat])
        global.db.data.chats[m.chat] = {}

    let chat = global.db.data.chats[m.chat]

    for (let key in chatDefaults) {
        if (!(key in chat) || chat[key] === undefined || chat[key] === null) {
            chat[key] = chatDefaults[key]
        }
    }

    if (!global.db.data.settings)
        global.db.data.settings = {}

    // Compute botJid robustly — fallback to decoding this.user.id if .jid is lost after reconnect
    const botJid = this.user?.jid || (this.user?.id ? this.decodeJid(this.user.id) : null)
    if (botJid) {
        // Re-set .jid so the rest of the code (plugins, enable.js, etc.) can use it
        if (!this.user.jid) this.user.jid = botJid

        const settingDefaults = {
            self: false,
            autoread: false,
            restrict: false,
            status: 0,
            solopv: false,
            sologp: true,
            restrictgp: true
        }

        if (!global.db.data.settings[botJid])
            global.db.data.settings[botJid] = {}

        settings = global.db.data.settings[botJid]

        for (let key in settingDefaults) {
            if (!(key in settings)) {
                settings[key] = settingDefaults[key]
            }
        }
        if (settings.self) {
            global.opts['self'] = true
            global.opts.self = true
        }
    }

} catch (e) {
    console.error('Error initializing data:', e)
}

//---- AA  

const opts = global.opts || {}
const isGroup = m.chat?.endsWith('g.us')
const text = typeof m.text === 'string' ? m.text : ''

m.text = text

// Modo escucha (no responde nada)
if (opts.nyimak) return
// Solo privado
if (settings.solopv && isGroup) return
// Solo estados
if (opts.swonly && m.chat !== 'status@broadcast') return


// =============================
// SAFE USER INIT (Minimal Fallback)
// =============================

if (!global.db.data.users[m.sender]) {
    global.db.data.users[m.sender] = {
        exp: 0,
        diamond: 500,
        level: 0,
        prem: false
    }
}


let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

const botNumber = this.user?.id?.replace(/:[0-9]+/g, '') || ''
const sender = ((await conn.getJid(m.sender)) || m.sender).split(':')[0] + '@s.whatsapp.net'
const normalize = v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net'

const isROwner = sender === botNumber || global.owner.some(v => sender === normalize(Array.isArray(v) ? v[0] : v))
const isOwner = isROwner || m.fromMe
const isMods = isOwner || global.mods.map(v => normalize(v)).includes(sender)
const isPrems = isROwner || global.prems.map(v => normalize(v)).includes(sender) || (_user?.prem === true)

        // Modo Self / Privado (Bot desligado para o público - 100% silencioso)
        if ((opts['self'] || opts.self || settings.self) && !isOwner && !isROwner) return

        // Solo grupos / Anti-PV (Bypass para o dono do bot)
        if (settings.sologp && !isGroup && !isOwner) return

        // Ativação de Licença de Aluguel (SENNA-...)
        if (isGroup && m.text && m.text.trim().toUpperCase().startsWith('SENNA-')) {
            let code = m.text.trim().toUpperCase()
            global.db.data.licenses = global.db.data.licenses || {}
            if (global.db.data.licenses[code]) {
                let license = global.db.data.licenses[code]
                let created = typeof license === 'object' ? license.created : Date.now()
                let duration = typeof license === 'object' ? license.duration : license
                
                if (Date.now() - created > 24 * 60 * 60 * 1000) {
                    delete global.db.data.licenses[code] // apaga licença expirada
                    await this.reply(m.chat, `🔴 *Licença expirada!* Esta licença foi gerada há mais de 24 horas e não foi utilizada a tempo.`, m)
                    return
                }
                
                let chat = global.db.data.chats[m.chat]
                
                if (duration === -1) {
                    chat.expired = -1
                } else {
                    let currentExpired = chat.expired && chat.expired > Date.now() ? chat.expired : Date.now()
                    if (chat.expired === -1) {
                        // mantém permanente
                    } else {
                        chat.expired = currentExpired + duration
                    }
                }
                
                delete global.db.data.licenses[code] // consome a licença (uso único)
                
                const formatDuration = (ms) => {
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
                
                let dateStr = chat.expired === -1 ? 'Nunca expira (Permanente)' : new Date(chat.expired).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                let durationStr = duration === -1 ? 'Permanente' : formatDuration(duration)
                
                await this.reply(m.chat, `✅ *LICENÇA RESGATADA COM SUCESSO!*\n\n🔑 *Código:* ${code}\n⏳ *Duração adicionada:* ${durationStr}\n📅 *Novo vencimento:* ${dateStr} (Brasília)\n\nObrigado por apoiar! O bot agora está ativado neste grupo.`, m)
                return
            } else {
                await this.reply(m.chat, `❌ *Licença inválida ou já utilizada!* Verifique se digitou corretamente.`, m)
                return
            }
        }



        if (opts['queque'] && m.text && !(isMods || isPrems)) {
            const previousID = this.msgqueque[this.msgqueque.length - 1]
            this.msgqueque.push(m.id || m.key.id)
            while (this.msgqueque.includes(previousID)) {
                await delay(5000)
            }
        }

        if (m.isBaileys)
            return
        m.exp += Math.ceil(Math.random() * 10)

        let usedPrefix
        
        const groupMetadata = m.isGroup ? await conn.getGroupMetadata(m.chat) : null
        const participants = groupMetadata?.participants || []
const user = (m.isGroup ? participants.find(u => this.decodeJid(u.id || u.jid) === this.decodeJid(m.sender)) : {}) || {}
const bot = (m.isGroup ? participants.find(u => { let id = this.decodeJid(u.id || u.jid); return id === this.decodeJid(this.user.jid) || id === this.decodeJid(this.user.lid) }) : {}) || {}

const isRAdmin = user?.admin === 'superadmin' || this.decodeJid(groupMetadata?.owner) === this.decodeJid(m.sender)
const isAdmin = !!user?.admin || this.decodeJid(groupMetadata?.owner) === this.decodeJid(m.sender)
const isBotAdmin = !!bot?.admin


        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
        
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin)
                continue
            if (plugin.disabled)
                continue
            const __filename = join(___dirname, name)

            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename
                    })
                } catch (e) {
                    // if (typeof e === 'string') continue
                    console.error(e)
                }
            }
            if (!opts['restrict'])
                if (plugin.tags && plugin.tags.includes('admin')) {
                    // global.dfail('restrict', m, this)
                    continue
                }
                
            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
            
            let match = (_prefix instanceof RegExp ? // RegExp Mode?
                [[_prefix.exec(m.text), _prefix]] :
                Array.isArray(_prefix) ? // Array?
                    _prefix.map(p => {
                        let re = p instanceof RegExp ? // RegExp in Array?
                            p :
                            new RegExp(str2Regex(p))
                        return [re.exec(m.text), re]
                    }) :
                    typeof _prefix === 'string' ? // String?
                        [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                        [[[], new RegExp]]
            ).find(p => p[1])
//--
            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }))
                    continue
            }

            if (typeof plugin !== 'function')
                continue

            
            if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = m.text.replace(usedPrefix, '')
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split` `.slice(1)
                let text = _args.join` `
                command = (command || '').toLowerCase()
                let fail = plugin.fail || global.dfail // When failed
                let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ? // Array?
                        plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                            cmd.test(command) :
                            cmd === command
                        ) :
                        typeof plugin.command === 'string' ? // String?
                            plugin.command === command :
                            false

                if (!isAccept)
                    continue
                m.plugin = name
                
                // Verificação de Aluguel (Bloqueio de comandos para grupos expirados/não autorizados)
                if (isGroup && !isOwner && name !== 'owner-aluguel.js') {
                    const botJid = this.user?.jid || (this.user?.id ? this.decodeJid(this.user.id) : '')
                    let chat = global.db.data.chats[m.chat]
                    let botSettings = global.db.data.settings[botJid] || {}
                    if (botSettings.restrictgp) {
                        if (chat.expired !== -1 && (!chat.expired || chat.expired === 0 || Date.now() > chat.expired)) {
                            let ownerNumber = Array.isArray(global.owner[0]) ? global.owner[0][0] : global.owner[0]
                            await this.reply(m.chat, `⚠️ *MODO ALUGUEL ATIVO*\n\nEste grupo não está autorizado a utilizar os comandos do bot ou o período de aluguel expirou.\n\nPara alugar o bot para o seu grupo ou ativar uma licença, entre em contato com o proprietário: *wa.me/${ownerNumber}*`, m)
                            return
                        }
                    }
                }

                if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                    let chat = global.db.data.chats[m.chat]
                    let user = global.db.data.users[m.sender]
                    if (name != 'owner-unbanchat.js' && chat?.isBanned)
                        return // Except this
                    if (name != 'owner-unbanUser.js' && user?.banned)
                        return
                }
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Both Owner
                    fail('owner', m, this)
                    continue
                }
                if (plugin.rowner && !isROwner) { // Real Owner
                    fail('rowner', m, this)
                    continue
                }
                if (plugin.owner && !isOwner) { // Number Owner
                    fail('owner', m, this)
                    continue
                }
                if (plugin.mods && !isMods) { // Moderator
                    fail('mods', m, this)
                    continue
                }
                if (plugin.premium && !isPrems) { // Usuarios Premium
                    fail('premium', m, this)
                    continue
                }
                if (plugin.group && !m.isGroup) { // Group Only
                    fail('group', m, this)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
                    fail('botAdmin', m, this)
                    continue
                } else if (plugin.admin && !isAdmin) { // User Admin
                    fail('admin', m, this)
                    continue
                }
                if (plugin.private && m.isGroup) { // Private Chat Only
                    fail('private', m, this)
                    continue
                }
                if (plugin.register == true && _user.registered == false) { // Butuh daftar?
                    fail('unreg', m, this)
                    continue
                }
                m.isCommand = true
                let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // Ganancia de XP por comando
                if (xp > 200)
                    m.reply('chirrido -_-') // Hehehe
                else
                    m.exp += xp
                if (!isPrems && plugin.diamond && global.db.data.users[m.sender].diamond < plugin.diamond * 1) {
                    this.reply(m.chat, `✳️ Tus diamantes se agotaron\nuse el siguiente comando para comprar más diamantes\n\n*${usedPrefix}buy*`, m)
                    continue // Limit habis
                }
                if (plugin.level > _user.level) {
                    this.reply(m.chat, `✳️ nivel requerido ${plugin.level} para usar este comando. \nTu nivel ${_user.level}`, m)
                    continue // If the level has not been reached
                }
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }
                try {
                    await plugin.call(this, m, extra)
                    // Só cobra diamantes se o comando foi executado SEM erros
                    if (!isPrems && !m.error)
                        m.diamond = m.diamond || plugin.diamond || false
                } catch (e) {
                    // Error occured - NÃO cobra diamantes
                    m.error = e
                    m.diamond = false
                    console.error(e)
                    if (e) {
                        let text = format(e)
                        for (let key of Object.values(global.APIKeys))
                            text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
                           m.reply(e) //error en el comando
                         // console.error(e)
                    }
                } finally {
                    // m.reply(util.format(_user))
                    if (typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (e) {
                            console.error(e)
                        }
                    }
                    if (m.diamond)
                        m.reply(`Usaste *${+m.diamond}* 💎`)
                }
                break
            }
            //
        }
    } catch (e) {
        console.error(e)
    } finally {
        if (opts['queque'] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }
        //console.log(global.db.data.users[m.sender])
        let user, stats = global.db.data.stats
        if (m) {
            if (m.sender && (user = global.db.data.users[m.sender])) {
                user.exp += m.exp
                user.diamond -= m.diamond * 1
            }

       
// 📊 CONTADOR DE MENSAJES POR GRUPO
if (m.isGroup && m.sender) {
    let statsMsg = global.db.data.statsMsg || {}

    let chatId = m.chat
    let userId = m.sender

    if (!statsMsg[chatId]) statsMsg[chatId] = {}
    if (!statsMsg[chatId][userId]) statsMsg[chatId][userId] = 0

    statsMsg[chatId][userId] += 1

    global.db.data.statsMsg = statsMsg
}

            let stat
            if (m.plugin) {
                let now = +new Date
                if (m.plugin in stats) {
                    stat = stats[m.plugin]
                    if (!isNumber(stat.total))
                        stat.total = 1
                    if (!isNumber(stat.success))
                        stat.success = m.error != null ? 0 : 1
                    if (!isNumber(stat.last))
                        stat.last = now
                    if (!isNumber(stat.lastSuccess))
                        stat.lastSuccess = m.error != null ? 0 : now
                } else
                    stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
                stat.total += 1
                stat.last = now
                if (m.error == null) {
                    stat.success += 1
                    stat.lastSuccess = now
                }
            }
        }

        try {
            if (!opts['noprint']) {
                if (!global._printModule) global._printModule = (await import('./lib/print.js')).default
                await global._printModule(m, this)
            }
        } catch (e) {
            console.log(m, m.quoted, e)
        }
        if (opts['autoread'])
            await this.chatRead(m.chat, m.isGroup ? m.sender : undefined, m.id || m.key.id).catch(() => { })
    }
}
//--
export async function participantsUpdate({ id, participants, action }) {
    if (opts['self']) return
    if (global.db.data == null) await loadDatabase()

    let chat = global.db.data.chats[id] || {}
    let text = ''

    // 🔥 Normalizador para v7
    const normalize = (p) =>
        typeof p === 'string' ? p : p?.id

    switch (action) {

        case 'add':
        case 'remove':
            if (!chat.welcome) break

            let groupMetadata =
                await this.groupMetadata(id).catch(_ => null) ||
                (conn.chats[id] || {}).metadata

            if (!groupMetadata) return

            for (let participant of participants) {

                const user = normalize(participant)
                if (!user) continue

                let pp = fg_avatar
                let ppgp = fg_avatar

                try { pp = await this.profilePictureUrl(user, 'image') } catch {}
                try { ppgp = await this.profilePictureUrl(id, 'image') } catch {}

                text = (action === 'add'
                    ? (chat.sWelcome || this.welcome || conn.welcome || 'Bienvenido, @user')
                        .replace('@group', await this.getName(id))
                        .replace('@desc', groupMetadata.desc?.toString() || 'Desconocido')
                    : (chat.sBye || this.bye || conn.bye || 'Adiós, @user')
                ).replace('@user', '@' + user.split('@')[0])

                try {
                    let imageUrl = action === 'add'
                        ? API('fgmods', '/api/welcome', {
                            username: await this.getName(user),
                            groupname: await this.getName(id),
                            groupicon: ppgp,
                            membercount: groupMetadata.participants?.length || 0,
                            profile: pp,
                            background: 'https://i.ibb.co/fkFmQC2/eve.jpg'
                        }, 'apikey')
                        : API('fgmods', '/api/goodbye2', {
                            username: await this.getName(user),
                            groupname: await this.getName(id),
                            groupicon: ppgp,
                            membercount: groupMetadata.participants?.length || 0,
                            profile: pp,
                            background: 'https://i.ibb.co/jh9367t/akali.jpg'
                        }, 'apikey')

                    await this.sendFile(id, imageUrl, 'welcome.jpg', text, null, false, {
                        mentions: [user]
                    })

                } catch {
                    await this.sendFile(id, pp, 'profile.jpg', text, null, false, {
                        mentions: [user]
                    })
                }
            }
            break


        case 'promote':
        case 'demote':
            if (!chat.detect) break

            for (let participant of participants) {

                const user = normalize(participant)
                if (!user) continue

                let pp = await this.profilePictureUrl(user, 'image')
                    .catch(_ => global.fg_avatar)

                text = action === 'promote'
                    ? (chat.sPromote || this.spromote || conn.spromote || '@user ahora es administrador 🛡️')
                    : (chat.sDemote || this.sdemote || conn.sdemote || '@user ya no es administrador')

                text = text.replace('@user', '@' + user.split('@')[0])

                await this.sendFile(id, pp, 'pp.jpg', text, null, false, {
                    mentions: [user]
                })
            }
            break
    }
}

/**
 * Handle groups update
 * @param {import('@whiskeysockets/baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate 
 */
export async function groupsUpdate(groupsUpdate) {
    if (opts['self'])
        return
    for (const groupUpdate of groupsUpdate) {
        const id = groupUpdate.id
        if (!id) continue
        let chats = global.db.data.chats[id], text = ''
        if (!chats?.detect) continue
        if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc).replace('@desc', groupUpdate.desc)
        if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject).replace('@group', groupUpdate.subject)
        if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon).replace('@icon', groupUpdate.icon)
        if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke).replace('@revoke', groupUpdate.revoke)
        if (!text) continue
        await this.sendMessage(id, { text, mentions: this.parseMention(text) })
    }
}

//-- anti delete msg
export async function deleteUpdate(update) {
    try {
        const { key, update: msgUpdate } = update || {}

       
        if (!key || !msgUpdate) return
        const { remoteJid, id, participant, fromMe } = key

        if (fromMe) return

        // detectar eliminación
        const isDelete =
            msgUpdate?.message?.protocolMessage?.type === 0 ||
            msgUpdate?.messageStubType === 1

        if (!isDelete) return

        // cargar mensaje original
        let raw = await this.loadMessage(remoteJid, id)
        if (!raw || !raw.message) return

        if (!raw.key) raw.key = {}
        if (raw.key.fromMe === undefined) raw.key.fromMe = false

        let msg = this.serializeM ? this.serializeM(raw) : raw

        let chat = global.db.data.chats?.[msg.chat] || {}
        if (chat.delete) return

        let user = participant || remoteJid

        // ---- Info ---
        let pushName = msg.pushName || 'Desconocido'
        let type = Object.keys(msg.message || {})[0] || 'desconocido'
        let text =
            msg.text ||
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            'Sin texto'

        let info = `
≡ *ANTI DELETE DETECTADO*

┌─⊷ 📌 *Usuario*
▢ *Nombre* : ${pushName}
▢ *Número* : @${user.split('@')[0]}
└─────────────
┌─⊷ 📂 *Mensaje*
▢ *Tipo* : ${type}
▢ *Contenido* : ${text}
└────────────

💡 Usa */off antidelete* para desactivar
`.trim()

        await this.reply(msg.chat, info, msg, {
            mentions: [user]
        })

        // reenviar mensaje original
        await this.copyNForward(msg.chat, raw).catch(e =>
            console.log('Forward error:', e)
        )

    } catch (e) {
        console.error('Error en deleteUpdate:', e)
    }
}


global.dfail = (type, m, conn) => {
    let msg = {
        rowner: `👑 Este comando solo puede ser utilizado por el *Creador del bot*`,
        owner: `🔱 Este comando solo puede ser utilizado por el *Owner y Sub Bots*`,
        mods: `🔰 Esta función es solo para *Para moderadores del Bot*`,
        premium: `💠 este comando é apenas para miembros *Premium*\n\nEscribe */premium* para más info`,
        group: `⚙️ Este comando solo se puede usar en grupos`,
        private: `📮 Este comando solo se puede usar en el chat *privado del Bot*`,
        admin: `🛡️ este comando é apenas para *Admins* del grupos`,
        botAdmin: `💥 ¡Para usar este comando debo ser *Administrador!*`,
        unreg: `📇 Regístrese para usar esta función  Escribiendo:\n\n*/reg*`,
        restrict: '🔐 Esta característica está *deshabilitada*'
    }[type]
    //if (msg) return conn.sendButton(m.chat, msg, mssg.ig, null, [['🔖 OK', 'khajs'], ['⦙☰ MENU', '/menu'] ], m)
    if (msg) return m.reply(msg)
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.magenta("✅  Se actualizo 'handler.js'"))
    if (global.reloadHandler) console.log(await global.reloadHandler())
}) 
