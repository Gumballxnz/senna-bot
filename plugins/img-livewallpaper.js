import axios from 'axios'

async function searchPinterestLive(query) {
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query + ' live wallpaper')}`
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 10000
    })

    const matches = data.match(/https:\/\/v1\.pinimg\.com\/videos\/[^\s"'<>]+\.mp4/gi) || []
    const unique = [...new Set(matches)]
    const hq = unique.filter(u => u.includes('720w') || u.includes('720p'))
    return hq.length > 0 ? hq : unique
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `✳️ Digite o tema do wallpaper animado\n\n📌 Exemplo: *${usedPrefix + command}* Cyberpunk`

    m.react(rwait)
    try {
        let results = await searchPinterestLive(text)
        if (!results || !results.length) {
            m.react('❌')
            return m.reply(`❌ Nenhum wallpaper animado encontrado para: *${text}*`)
        }

        let randomVideo = results[Math.floor(Math.random() * results.length)]
        await conn.sendMessage(m.chat, {
            video: { url: randomVideo },
            caption: `🎬 *Live Wallpaper (Pinterest)*\n\n🔍 *Busca:* ${text}`,
            mimetype: 'video/mp4'
        }, { quoted: m })
        m.react(done)
    } catch (error) {
        m.react('❌')
        m.reply(`❌ Erro ao buscar wallpaper animado no Pinterest.`)
    }
}

handler.help = ['livewallpaper <termo>', 'wpvideo <termo>']
handler.tags = ['img']
handler.command = ['livewallpaper', 'livewp', 'wpvideo', 'wpanimado']
handler.diamond = true

export default handler
