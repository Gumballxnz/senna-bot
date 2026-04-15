import fg from 'fg-senna'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import { pipeline } from 'stream/promises'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!args[0]) throw `✳️ Insira un Link de Facebook\n\n📌 Exemplo :\n*${usedPrefix + command}* https://fb.watch/d7nB8-L-gR/`
  m.react('⏳')

  try {
    // Corrida entre APIs — a primeira que responder ganha
    let url = null

    let results = await Promise.allSettled([
      fg.fbdl(args[0]).then(r => r?.HD || r?.SD || r?.videoUrl || null),
      fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(args[0])}`).then(v => v.json()).then(j => j?.data?.url || j?.data?.hd || j?.data?.sd || null).catch(() => null)
    ])

    // Pegar o primeiro resultado que não seja null
    for (let r of results) {
      if (r.status === 'fulfilled' && r.value) { url = r.value; break }
    }

    if (!url) throw new Error('Falha no link HD/SD')

    const TEMP_DIR = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
    const filePath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`)

    let dl = await fetch(url)
    await pipeline(dl.body, fs.createWriteStream(filePath))

    await conn.sendFile(m.chat, filePath, 'fb.mp4', `✅ Resultado`, m, null, { asDocument: false })
    fs.unlinkSync(filePath)
    
    m.react('✅')
  } catch (error) {
    m.reply("❎ Erro: Não foi possível obter o vídeo (Link privado ou bloqueado). Tente novamente mais tarde.") 
  }
}
handler.help = ['facebook'].map(v => v + ' <url>')
handler.tags = ['dl']
handler.command = /^((facebook|fb)(downloder|dl)?)$/i
handler.diamond = true

export default handler
