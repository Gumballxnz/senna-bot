
import fg from 'fg-senna'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!args[0]) throw `✳️ Insira un Link de Instagram`
  m.react(rwait)

  let success = false

  // Motor 1: fg-senna (Direto, Rápido, Buffer nativo)
  try {
    let data = await fg.igdl(args[0])
    if (data) {
      let urls = []
      if (data.result && Array.isArray(data.result) && data.result.length >= 1) {
        urls = data.result.map(i => i.url || i.dl_url).filter(Boolean)
      } else if (data.dl_url) {
        urls = [data.dl_url]
      } else if (data.url) {
        urls = [data.url]
      }

      if (urls.length >= 1) {
        const axios = (await import('axios')).default
        const sharp = (await import('sharp')).default
        for (let url of urls) {
          try {
            const res = await axios.get(url, {
              responseType: 'arraybuffer',
              headers: { 'User-Agent': 'TelegramBot (like TwitterBot)' },
              timeout: 45000
            })
            let buffer = Buffer.from(res.data)
            const isVideo = url.includes('.mp4') || (res.headers['content-type'] && res.headers['content-type'].includes('video')) || buffer.toString('utf8', 4, 12).includes('ftyp')
            if (!isVideo) {
              if (buffer.slice(0, 4).toString() === 'RIFF') {
                try {
                  buffer = await sharp(buffer).jpeg({ quality: 92 }).toBuffer()
                } catch (_) {}
              }
              await conn.sendFile(m.chat, buffer, 'instagram.jpg', `✅ Resultado`, m, null, fwc)
            } else {
              await conn.sendFile(m.chat, buffer, 'instagram.mp4', `✅ Resultado`, m, null, fwc)
            }
            success = true
          } catch (dlErr) {
            console.error('❌ [IGDL] Erro ao baixar buffer:', dlErr.message)
          }
        }
        if (success) {
          m.react(done)
          return
        }
      }
    }
  } catch (e) {
    console.error('❌ [IGDL] fg-senna falhou:', e.message)
  }

  // Motor 3: yt-dlp local (Alta Qualidade como fallback)
  const TEMP_DIR = path.join(process.cwd(), 'tmp')
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
  const rawPath = path.join(TEMP_DIR, `ig_raw_${Date.now()}.mp4`)
  const finalPath = path.join(TEMP_DIR, `ig_${Date.now()}.mp4`)

  let cookiesFlag = ''
  const cookiesPath = path.join(process.cwd(), 'cookies.txt')
  if (fs.existsSync(cookiesPath)) cookiesFlag = `--cookies "${cookiesPath}"`

  try {
    await execAsync(`yt-dlp ${cookiesFlag} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${args[0]}"`, { timeout: 120000 })
    if (fs.existsSync(rawPath)) {
      await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
      if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
      if (fs.existsSync(finalPath)) {
        await conn.sendFile(m.chat, finalPath, 'ig.mp4', `✅ *Instagram (HD)*`, m, null, fwc)
        fs.unlinkSync(finalPath)
        success = true
      }
    }
  } catch (ee) {
    console.error('❌ [IGDL] yt-dlp falhou:', ee.message)
    try { if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath) } catch(e) {}
    try { if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath) } catch(e) {}
  }

  // Motor 4: APIs de fallback externas
  if (!success) {
    const fetch = (await import('node-fetch')).default
    const encodedUrl = encodeURIComponent(args[0])
    const apis = [
      { name: 'instavideosave', url: `https://www.instavideosave.net/api/instagram`, method: 'POST', body: JSON.stringify({ url: args[0] }), headers: { 'Content-Type': 'application/json' } },
    ]

    for (let api of apis) {
      try {
        let res = await fetch(api.url, { method: api.method, body: api.body, headers: api.headers, timeout: 15000 })
        let json = await res.json().catch(() => null)
        let url = json?.data?.[0]?.url || json?.data?.url || json?.url || json?.result?.[0]?.url
        if (url) {
          await conn.sendFile(m.chat, url, 'ig.mp4', `✅ *Instagram (${api.name})*`, m, null, fwc)
          success = true
          break
        }
      } catch (e) {
        console.error(`❌ [IGDL] API ${api.name} falhou:`, e.message)
      }
    }
  }

  if (!success) {
    m.react('❌')
    m.reply(`❎ Nenhum motor conseguiu baixar este link do Instagram.\n\n💡 *Possíveis causas:*\n▢ O post é privado\n▢ O link está quebrado\n▢ Instagram bloqueou o download\n\nTente novamente mais tarde.`)
  } else {
    m.react(done)
  }
}
handler.help = ['instagram'].map(v => v + ' <url>')
handler.tags = ['dl']
handler.command = ['igdl', "instagramdl", "instagram"]
handler.diamond = true

export default handler
