import fg from 'fg-senna'
import axios from 'axios'
import * as cheerio from 'cheerio'

async function getXnxxDirect(url) {
    try {
        const res = await axios.get(url, {
            headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
            timeout: 15000
        })
        const $ = cheerio.load(res.data)
        const url_dl = $('#html5video_base a').attr('href') || $('#html5video_base div a').attr('href')
        const title = $('meta[property="og:title"]').attr('content') || 'XNXX Video'
        return url_dl ? { url_dl, title } : null
    } catch {
        return null
    }
}

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
    let chat = global.db.data.chats[m.chat]
    if (!chat.nsfw) throw `🚫 El grupo no admite contenido nsfw\nUsa este grupo\n${fg_gpnsfw}\n\nSi eres admin habilita con\n*${usedPrefix}enable* nsfw`
    let user = global.db.data.users[m.sender].age
    if (user < 17) throw `❎ Eres menor de edad! vuelve cuando tengas mas de 18`
    if (!text) throw `✳️ Ingresa lo que desea buscar`

    m.react(rwait)
    if (text.includes('http://') || text.includes('https://')) {
        if (!text.includes('xnxx.com')) return m.reply(`❎ Revisa que el link correcto`)
        try {
            let xn = await fg.xnxx(text).catch(() => null)
            let videoUrl = xn?.url_dl
            let title = xn?.title
            if (!videoUrl) {
                const direct = await getXnxxDirect(text)
                if (direct?.url_dl) {
                    videoUrl = direct.url_dl
                    title = title || direct.title
                }
            }
            if (!videoUrl) throw new Error('Falha ao extrair URL')
            await conn.sendFile(m.chat, videoUrl, (title || 'xnxx') + '.mp4', `
≡  *XNXX DL*

*📌Titulo*: ${title || 'XNXX Video'}
*⌚Duracion:* ${xn?.duration || '--'}
*🎞️Calidad:* ${xn?.quality || '--'}
`.trim(), m, false, { asDocument: chat.useDocument })
            m.react(done)
        } catch (e) {
            m.react('❌')
            m.reply('🔴 Não foi possível obter o vídeo.')
        }
    } else {
        try {
            let res = await fg.sxnxx(text)
            let fgg = res.result.map((v, i) => `*📌Titulo* : ${v.title}\n*🔗Link:* ${v.link}\n`).join('─────────────────\n\n')
            if (res.status) m.reply(fgg)
        } catch (e) {
            m.reply(`🔴 Error`, null, fwc)
        }
    }
}
handler.help = ['xnxx <busca|link>', 'xnxxdl <link>']
handler.tags = ['nsfw', 'prem']
handler.command = ['xnxxsearch', 'xnxxdl', 'xnxx']
handler.diamond = 2
handler.premium = false
handler.register = true

export default handler
