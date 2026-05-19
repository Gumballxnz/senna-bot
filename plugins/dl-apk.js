import fetch from 'node-fetch'
import fg from 'fg-senna'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `✳️ Pesquise um aplicativo!\n\n📌 Exemplo:\n*${usedPrefix + command}* Spotify\n*${usedPrefix + command}* WhatsApp`

  m.react('⏳')

  try {
    // 1. Pesquisa o App no APKPure via fg-senna
    let searchRes = await fg.apks(text)
    if (!searchRes || searchRes.length === 0) {
      throw 'App não encontrado. Tente um nome mais específico.'
    }

    let firstApp = searchRes[0]

    // 2. Coleta os detalhes de download do pacote exato
    let appInfo = await fg.apkdl(firstApp.pkg)
    if (!appInfo || (!appInfo.download && !firstApp.dl_apk)) {
       throw 'Não foi possível extrair o link do ficheiro APK.'
    }

    let name = appInfo.name || firstApp.name
    let developer = appInfo.developer || firstApp.developer || 'Desconhecido'
    let version = appInfo.version || 'N/A'
    let sizeMB = appInfo.size || 'Desconhecido'
    let icon = appInfo.icon || firstApp.icon
    let apkUrl = appInfo.download || firstApp.dl_apk

    let caption = `╭─「 📱 *APKPURE DOWNLOADER* 」
│
│ 📌 *Nome:* ${name}
│ 👤 *Dev:* ${developer}
│ 📦 *Tamanho:* ${sizeMB}
│ 🆙 *Versão:* ${version}
│ 🔍 *Pacote:* ${firstApp.pkg}
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