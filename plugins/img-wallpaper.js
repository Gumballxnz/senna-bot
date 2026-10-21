import axios from 'axios'
import * as cheerio from 'cheerio'

async function searchPinterest(query) {
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 10000
    })

    const $ = cheerio.load(data)
    const results = []
    const seen = new Set()

    $('img').each((_, el) => {
        let src = $(el).attr('src') || ''
        let srcset = $(el).attr('srcset') || ''
        if (!src.includes('i.pinimg.com') || src.includes('60x60') || src.includes('75x75') || src.includes('150x150')) return

        let bestUrl = null
        if (srcset) {
            let parts = srcset.split(',').map(s => s.trim().split(' '))
            let orig = parts.find(p => p[0]?.includes('/originals/')) || parts.find(p => p[0]?.includes('/736x/'))
            if (orig) bestUrl = orig[0]
        }
        if (!bestUrl && (src.includes('/236x/') || src.includes('/474x/') || src.includes('/736x/'))) {
            bestUrl = src.replace(/\/(236x|474x)\//, '/736x/')
        }
        if (bestUrl && !seen.has(bestUrl)) {
            seen.add(bestUrl)
            results.push(bestUrl)
        }
    })

    return results
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `✳️ Digite o que deseja buscar\n\n📌 Exemplo: *${usedPrefix + command}* Mia Khalifa`

    m.react(rwait)
    try {
        let results = await searchPinterest(text)
        if (!results || !results.length) {
            m.react('❌')
            return m.reply(`❌ Nenhum wallpaper encontrado no Pinterest para: *${text}*`)
        }

        let randomImg = results[Math.floor(Math.random() * results.length)]
        await conn.sendMessage(m.chat, { 
            image: { url: randomImg }, 
            caption: `🖼️ *Wallpaper (Pinterest)*\n\n🔍 *Busca:* ${text}` 
        }, { quoted: m })
        m.react(done)
    } catch (error) {
        m.react('❌')
        m.reply(`❌ Erro ao buscar wallpaper no Pinterest.`)
    }
}

handler.help = ['wallpaper <termo>', 'pinterest <termo>']
handler.tags = ['img']
handler.command = ['wallpaper', 'wallpapers', 'wp', 'pinterest', 'pin']
handler.diamond = true

export default handler
