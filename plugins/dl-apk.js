import gplay from 'google-play-scraper'
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `✳️ Pesquise um aplicativo!\n\n📌 Exemplo:\n*${usedPrefix + command}* Spotify\n*${usedPrefix + command}* WhatsApp`

  m.react(rwait)

  try {
    // Busca na Google Play Store
    let results = await gplay.search({
      term: text,
      num: 1,
      lang: 'pt',
      country: 'BR'
    })

    if (!results || results.length === 0) throw 'App não encontrado.'

    let app = results[0]

    // Busca detalhes completos do app
    let details = await gplay.app({
      appId: app.appId,
      lang: 'pt',
      country: 'BR'
    })

    // Formata a nota com estrelas
    let stars = '⭐'.repeat(Math.round(details.score || 0))

    // Formata o número de downloads
    let installs = details.installs || 'N/A'

    // Monta o link de download direto via APKPure
    let apkpureUrl = `https://apkpure.com/search?q=${encodeURIComponent(details.appId)}`

    let caption = `╭─「 📱 *PLAY STORE* 」
│
│ 📌 *Nome:* ${details.title}
│ 👤 *Dev:* ${details.developer}
│ ⭐ *Nota:* ${(details.score || 0).toFixed(1)} ${stars}
│ 📥 *Downloads:* ${installs}
│ 📦 *Tamanho:* ${details.size || 'Variável'}
│ 🆙 *Versão:* ${details.version || 'N/A'}
│ 📅 *Atualizado:* ${details.updated ? new Date(details.updated).toLocaleDateString('pt-BR') : 'N/A'}
│ 💰 *Preço:* ${details.free ? 'Grátis ✅' : details.priceText}
│ 🔞 *Classificação:* ${details.contentRating || 'Livre'}
│
│ 📝 *Descrição:*
│ ${(details.summary || details.description || '').slice(0, 200)}...
│
│ 🔗 *Play Store:*
│ ${details.url}
│
│ 📥 *Baixar APK:*
│ ${apkpureUrl}
│
╰──────────────`

    // Envia o ícone do app com todas as informações
    let icon = details.icon || app.icon
    if (icon) {
      await conn.sendFile(m.chat, icon, 'icon.png', caption, m, null, fwc)
    } else {
      m.reply(caption)
    }

    m.react(done)
  } catch (e) {
    console.error('APK Search Error:', e)
    m.react('❌')
    m.reply(`❎ Erro ao buscar o app: ${e.message || e}`)
  }
}

handler.help = ['apk <nome do app>']
handler.tags = ['dl']
handler.command = ['apk', 'app', 'playstore']

export default handler