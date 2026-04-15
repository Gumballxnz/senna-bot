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
        global.db.data.users[user] = { banned: false }
    } else {
        global.db.data.users[user].banned = false
    }

    let number = user.split('@')[0]
    conn.reply(m.chat, `✅ DESBANIDO\n\n───────────\n@${number} Foi desbanido e pode voltar a usar meus comandos!`, m, { mentions: [user] })
}
handler.help = ['unban @user']
handler.tags = ['owner']
handler.command = ['unban'] 
handler.rowner = true

export default handler
