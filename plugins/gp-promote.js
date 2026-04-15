
let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isOwner }) => {
    if (!isAdmin && !isOwner) return dfail('admin', m, conn)

    let user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
    if (!user) throw `✳️ Mencione o membro ou responda a uma mensagem dele\n\n📌 Exemplo: *${usedPrefix + command}* @user`

    let groupMetadata = await conn.groupMetadata(m.chat)
    let participant = groupMetadata.participants.find(p => p.id === user)
    
    if (!participant) throw `❎ Esse usuário não está no grupo!`

    let isTargetAdmin = participant.admin === 'admin' || participant.admin === 'superadmin'

    if (command === 'promote' || command === 'promover') {
        if (isTargetAdmin) throw `⚠️ @${user.split('@')[0]} já é administrador!`
        await conn.groupParticipantsUpdate(m.chat, [user], 'promote')
        m.reply(`✅ @${user.split('@')[0]} foi promovido a administrador! 🛡️`, null, { mentions: [user] })
    } else {
        if (!isTargetAdmin) throw `⚠️ @${user.split('@')[0]} já não é administrador!`
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
