
let handler = async(m, { conn, usedPrefix, command }) => {

    let don = `
≡ *DOAÇÃO*\nSe quiser apoiar o bot, entre em contacto com o dono!

▢ *PayPal*
• *Email :* fbilionario01@gmail.com

▢ *WhatsApp*
• *Link :* https://wa.me/258879116693
`
let img = 'https://i.ibb.co/37FP2bk/donate.jpg'
conn.sendFile(m.chat, img, 'img.jpg', don, m)
}

handler.help = ['donate']
handler.tags = ['main']
handler.command = ['apoyar', 'donate', 'donar'] 

export default handler
