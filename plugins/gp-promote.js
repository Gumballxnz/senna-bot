
let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isOwner }) => {
    if (!isAdmin && !isOwner) return dfail('admin', m, conn)

    let user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
    if (!user) throw `✳️ Mencione o membro ou responda a uma mensagem dele\n\n📌 Exemplo: *${usedPrefix + command}* @user`

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
handler.group = true
handler.botAdmin = true

export default handler
