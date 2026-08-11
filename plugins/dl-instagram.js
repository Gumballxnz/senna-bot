
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

  // Motor 1: Cobalt API (Principal - Rápido e Seguro)
  try {
    const { downloadCobalt } = await import('../lib/ytHelper.js')
    let cobaltRes = await downloadCobalt(args[0])
    if (cobaltRes) {
      if (cobaltRes.isPicker) {
        for (let url of cobaltRes.items) {
          await conn.sendFile(m.chat, url, 'instagram.mp4', `✅ Resultado`, m, null, fwc)
        }
        success = true
        m.react(done)
        return
      } else if (fs.existsSync(cobaltRes.filePath)) {
        await conn.sendFile(m.chat, cobaltRes.filePath, cobaltRes.title || 'instagram.mp4', `✅ *Instagram (Cobalt)*`, m, null, fwc)
        if (fs.existsSync(cobaltRes.filePath)) fs.unlinkSync(cobaltRes.filePath)
        success = true
        m.react(done)
        return
      }
    }
  } catch (e) {
    console.error('❌ [IGDL] Cobalt falhou:', e.message)
  }

  // Motor 2: fg-senna (API externa)
  let data = null
  if (!success) {
    try {
      data = await fg.igdl(args[0])
      if (data) {
        let urls = []
        if (data.result && data.result.length >= 1) {
          urls = data.result.map(i => i.url)
        } else if (data.dl_url) {
          urls = [data.dl_url]
        }

        if (urls.length >= 1) {
          for (let url of urls) {
            await conn.sendFile(m.chat, url, 'instagram.mp4', `✅ Resultado`, m, null, fwc)
          }
          success = true
          m.react(done)
          return
        }
      }
    } catch (e) {
      console.error('❌ [IGDL] fg-senna falhou:', e.message)
    }
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
