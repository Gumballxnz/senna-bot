
let handler = async (m, { conn, isOwner }) => {
    if (!isOwner) return dfail('owner', m, conn)
    global.db.data.chats[m.chat].isBanned = true
    m.reply(`✅ Se desactivó el Bot en este grupo`)
}
handler.help = ['banchat']
handler.tags = ['owner']
handler.command = ['banchat', 'chatoff'] 
handler.group = true

export default handler
 
