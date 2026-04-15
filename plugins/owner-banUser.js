let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user
    if (m.quoted) {
        user = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid[0]) {
        user = m.mentionedJid[0]
    } else if (text) {
        let txt = text.replace(/[^0-9]/g, '')
        if (txt) user = txt + '@s.whatsapp.net'
    }

    if (!user) {
        return m.reply(`✳️ Mencione o usuário ou responda a uma de suas mensagens\n\n📌 Exemplo: ${usedPrefix + command} @user`)
    }

    if (typeof global.db.data.users[user] === 'undefined') {
        global.db.data.users[user] = { banned: true }
    } else {
        global.db.data.users[user].banned = true
    }

    let number = user.split('@')[0]
    conn.reply(m.chat, `✅ BANIDO\n\n───────────\n@${number} Já não poderá usar meus comandos!`, m, { mentions: [user] })
}
handler.help = ['ban @user']
handler.tags = ['owner']
handler.command = ['ban'] 
handler.rowner = true

export default handler
