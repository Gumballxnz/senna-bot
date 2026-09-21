import { join } from 'path'

let handler = async function (m, { conn, text, usedPrefix, __dirname }) {

let m2 = `
≡ Use estos comandos sin el prefijo: *${usedPrefix}*
┌─⊷ *AUDIOS* 
▢ Bot
▢ Buenos días
▢ Buenas tardes 
▢ Buenas noches
▢ Fino señores
▢ Sad
└──────────────
`
    let pp = join(__dirname, '../src/fg_logo.jpg')

    await conn.sendFile(m.chat, pp, 'menu.jpg', m2, m, null, fwc)
}

handler.help = ['menu2']
handler.tags = ['main']
handler.command = ['menu2', 'audios']

export default handler
