let handler = async (m, { conn, isOwner }) => {
    if (!isOwner) return dfail('owner', m, conn)
    global.db.data.chats[m.chat].isBanned = true
    m.reply(`✅ O bot foi desativado neste grupo`)
}
handler.help = ['banchat']
handler.tags = ['owner']
handler.command = ['banchat', 'chatoff']
handler.group = true

export default handler
