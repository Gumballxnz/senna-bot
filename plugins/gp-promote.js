
let handler = async (m, { conn, args, usedPrefix, command }) => {

    let user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
    if (!user) throw `✳️ Mencione o membro ou responda a uma mensagem dele\n\n📌 Exemplo: *${usedPrefix + command}* @user`

    let groupMetadata = await conn.groupMetadata(m.chat)
    let participants = groupMetadata.participants
    let botNumber = conn.user.jid.split(':')[0] + '@s.whatsapp.net'
    let isBotAdmin = participants.find(p => p.id === botNumber)?.admin

    if (!isBotAdmin) throw '❎ O bot precisa ser administrador para usar este comando!'

    if (command === 'promote' || command === 'promover') {
        await conn.groupParticipantsUpdate(m.chat, [user], 'promote')
        m.reply(`✅ @${user.split('@')[0]} foi promovido a administrador! 🛡️`, null, { mentions: [user] })
    } else {
        await conn.groupParticipantsUpdate(m.chat, [user], 'demote')
        m.reply(`✅ @${user.split('@')[0]} foi rebaixado! ⬇️`, null, { mentions: [user] })
    }
}
handler.help = ['promote @user', 'demote @user']
handler.tags = ['group']
handler.command = ['promote', 'promover', 'demote', 'rebaixar']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
