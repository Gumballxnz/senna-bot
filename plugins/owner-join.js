let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

let handler = async (m, { conn, text, isOwner, usedPrefix, command }) => {
    if (!isOwner) return global.dfail('owner', m, conn)
    if (!text) return m.reply(`✳️ *Como usar:*\n${usedPrefix + command} <link do grupo>\n\n*Exemplo:* ${usedPrefix + command} https://chat.whatsapp.com/Code`)
    
    let [_, code] = text.match(linkRegex) || []
    if (!code) return m.reply(`❌ Link de convite inválido!`)
    
    try {
        await conn.groupAcceptInvite(code)
        m.reply(`✅ *Sucesso!* O bot entrou no grupo.`)
    } catch (e) {
        m.reply(`❌ Ocorreu um erro ao entrar no grupo: ${e.message || e}`)
    }
}

handler.help = ['join <link>']
handler.tags = ['owner']
handler.command = ['join', 'entrar']

export default handler
