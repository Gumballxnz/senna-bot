import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `✳️ Pesquise um aplicativo!\n\n📌 Exemplo:\n*${usedPrefix + command}* Spotify\n*${usedPrefix + command}* WhatsApp`

  m.react('⏳')

  try {
    // Busca o APK diretamente na Aptoide API (que fornece link de download real)
    let res = await fetch(`https://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(text)}&limit=1`)
    let data = await res.json()

    if (!data.datalist || !data.datalist.list || data.datalist.list.length === 0) {
      throw 'App não encontrado na base de dados.'
    }

    let app = data.datalist.list[0]
    
    // Extraindo detalhes
    let name = app.name
    let developer = app.developer ? app.developer.name : 'Desconhecido'
    let version = app.file ? app.file.vername : 'N/A'
    let sizeMB = app.size ? (app.size / 1048576).toFixed(2) + ' MB' : 'Desconhecido'
    let downloads = app.stats ? app.stats.downloads : 'N/A'
    let icon = app.icon
    let apkUrl = app.file ? app.file.path : null

    if (!apkUrl) throw 'Não foi possível extrair o link do ficheiro APK.'

    let caption = `╭─「 📱 *APTOIDE DOWNLOADER* 」
│
│ 📌 *Nome:* ${name}
│ 👤 *Dev:* ${developer}
│ 📥 *Downloads:* ${downloads}
│ 📦 *Tamanho:* ${sizeMB}
│ 🆙 *Versão:* ${version}
│
│ ⏳ *Enviando o ficheiro APK, por favor aguarde...*
╰──────────────`

    // Envia o catálogo com o Ícone do App
    await conn.sendFile(m.chat, icon, 'icon.jpg', caption, m)

    // Impede crash de falta de memória enviando como Documento direto do URL
    await conn.sendMessage(
      m.chat, 
      { 
        document: { url: apkUrl }, 
        mimetype: 'application/vnd.android.package-archive', 
        fileName: `${name.replace(/\s+/g, '_')}_v${version}.apk`,
        caption: `📦 *${name}*`
      }, 
      { quoted: m }
    )

    m.react('✅')
  } catch (e) {
    console.error('APK DL Error:', e)
    m.react('❌')
    m.reply(`❎ Erro: ${e}`)
  }
}

handler.help = ['apk'].map(v => v + ' <app>')
handler.tags = ['dl']
handler.command = ['apk', 'modapk']
handler.diamond = false

export default handler