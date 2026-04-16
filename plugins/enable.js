
let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {

  let isEnable = /true|enable|(turn)?on|1/i.test(command)
  let chat = global.db.data.chats[m.chat]
  let user = global.db.data.users[m.sender]
  let bot = global.db.data.settings[conn.user.jid] || {}
  let type = (args[0] || '').toLowerCase()
  let isAll = false, isUser = false
  
  // Função para verificar se já está no estado desejado
  const checkState = (current) => {
    if (isEnable && current) return `⚠️ *${type.toUpperCase()}* já está *Ativado* neste grupo!`
    if (!isEnable && !current) return `⚠️ *${type.toUpperCase()}* já está *Desativado* neste grupo!`
    return null
  }

  let statusMsg = null

  switch (type) {
    case 'welcome':
    case 'bv':
    case 'bienvenida':
      if (m.isGroup && !isAdmin) return global.dfail('admin', m, conn)
      if (!m.isGroup && !isOwner) return global.dfail('group', m, conn)
      statusMsg = checkState(chat.welcome)
      if (statusMsg) return m.reply(statusMsg)
      chat.welcome = isEnable
      break
      
    case 'detect':
    case 'detector':
      if (m.isGroup && !isAdmin) return global.dfail('admin', m, conn)
      if (!m.isGroup && !isOwner) return global.dfail('group', m, conn)
      statusMsg = checkState(chat.detect)
      if (statusMsg) return m.reply(statusMsg)
      chat.detect = isEnable
      break
    
    case 'antidelete':
    case 'delete':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      // Nota: o sistema original usa chat.delete = !isEnable para antidelete
      statusMsg = checkState(!chat.delete) 
      if (statusMsg) return m.reply(statusMsg)
      chat.delete = !isEnable
      break

    case 'document':
    case 'documento':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      statusMsg = checkState(chat.useDocument)
      if (statusMsg) return m.reply(statusMsg)
      chat.useDocument = isEnable
      break

    case 'public':
    case 'publico':
      isAll = true
      if (!isROwner) return global.dfail('rowner', m, conn)
      statusMsg = checkState(!global.opts['self'])
      if (statusMsg) return m.reply(statusMsg.replace('neste grupo', 'no bot'))
      global.opts['self'] = !isEnable
      break

    case 'antilink':
    case 'antilinkwa':
    case 'antilinkwha':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      statusMsg = checkState(chat.antiLink)
      if (statusMsg) return m.reply(statusMsg)
      chat.antiLink = isEnable
      break
      
    case 'captcha':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      statusMsg = checkState(chat.captcha)
      if (statusMsg) return m.reply(statusMsg)
      chat.captcha = isEnable
      break

    case 'antibotclone':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      statusMsg = checkState(chat.antiBotClone)
      if (statusMsg) return m.reply(statusMsg)
      chat.antiBotClone = isEnable
      break
      
    case 'nsfw':
    case '+18':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      statusMsg = checkState(chat.nsfw)
      if (statusMsg) return m.reply(statusMsg)
      chat.nsfw = isEnable          
      break

    case 'autodl':
    case 'autodownload':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      statusMsg = checkState(chat.autodl)
      if (statusMsg) return m.reply(statusMsg)
      chat.autodl = isEnable
      break

    case 'autolevelup':
      isUser = true
      statusMsg = checkState(user.autolevelup)
      if (statusMsg) return m.reply(statusMsg.replace('neste grupo', 'para você'))
      user.autolevelup = isEnable
      break
      
    case 'chatbot':
    case 'autosimi':
      isUser = true
      statusMsg = checkState(user.chatbot)
      if (statusMsg) return m.reply(statusMsg.replace('neste grupo', 'para você'))
      user.chatbot = isEnable
      break
      
    case 'restrict':
    case 'restringir':
      isAll = true
      if (!isOwner) return global.dfail('owner', m, conn)
      statusMsg = checkState(bot.restrict)
      if (statusMsg) return m.reply(statusMsg.replace('neste grupo', 'no bot'))
      bot.restrict = isEnable
      break
    
    case 'onlypv':
      isAll = true
      if (!isOwner) return global.dfail('owner', m, conn)
      statusMsg = checkState(bot.solopv)
      if (statusMsg) return m.reply(statusMsg.replace('neste grupo', 'no bot'))
      bot.solopv = isEnable
      break
      
    case 'sologp':
      isAll = true
      if (!isOwner) return global.dfail('owner', m, conn)
      statusMsg = checkState(bot.sologp)
      if (statusMsg) return m.reply(statusMsg.replace('neste grupo', 'no bot'))
      bot.sologp = isEnable
      break
      
    default:
      if (!/[01]/.test(command)) return m.reply(`
≡ *LISTA DE OPÇÕES*

┌─⊷ *ADMIN*
▢ welcome
▢ antilink
▢ detect 
▢ document
▢ nsfw
▢ antidelete
▢ captcha
▢ autodl
└───────────── 
┌─⊷ *USUÁRIOS*
▢ autolevelup
▢ chatbot 
└─────────────
┌─⊷ *OWNER*
▢ antibotclone
▢ public
▢ solopv
▢ sologp
└─────────────

*📌 Exemplo:*
*${usedPrefix}on* welcome
*${usedPrefix}off* welcome
`.trim(), null, fwc)
      throw false
  }

  m.reply(`
✅ *${type.toUpperCase()}* agora está *${isEnable ? `Ativado` : `Desativado`}* ${isAll ? `para este bot` : isUser ? 'para você' : `para este grupo`}
`.trim(), null, fwc) 

}
handler.help = ['on', 'off'].map(v => v + ' <opção>')
handler.tags = ['nable']
handler.command = /^((en|dis)able|(tru|fals)e|(turn)?o(n|ff)|[01])$/i

export default handler
