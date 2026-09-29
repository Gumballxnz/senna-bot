let handler = async (m, { conn, isOwner, isAdmin, isROwner} ) => {
    if (!(isAdmin || isOwner)) return dfail('admin', m, conn)
    global.db.data.chats[m.chat].isBanned = false
    m.reply(`✅ O bot foi ativado neste grupo`)
}
handler.help = ['unbanchat']
handler.tags = ['owner']
handler.command = ['chaton', 'unbanchat']

export default handler
