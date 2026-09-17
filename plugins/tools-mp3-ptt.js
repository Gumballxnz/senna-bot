import { toAudio, toPTT } from '../lib/converter.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    const isQuoted = m.quoted ? m.quoted : m
    const mime = (m.quoted ? m.quoted : m.msg).mimetype || ''

    if (!/audio|video/i.test(mime)) {
      throw `⚠️ Respondé a un video o audio con *${usedPrefix + command}*`
    }

    const media = await isQuoted.download()
    if (!media) throw '❌ No se pudo descargar el archivo'

    if (/mp3|audio$/i.test(command)) {
      const audio = await toAudio(media, 'mp4')
      if (!audio?.data) throw '❌ Erro al convertir a MP3'

      conn.sendFile(m.chat, audio.data, 'audio.ogg', '', m, false)

    }

    if (/vn|av$/i.test(command)) {
      const audio = await toPTT(media, 'mp4')
      if (!audio?.data) throw '❌ Erro al convertir a nota de voz'

    conn.sendMessage(m.chat,{audio: audio.data, mimetype: 'audio/mp4', ptt: true },{ quoted: m })

    }

  } catch (err) {
    console.error('Error converter:', err)
    m.reply(typeof err === 'string' ? err : '❌ Ocorreu um erro inaguardedo')
  }
}

handler.help = ['tomp3', 'toaudio']
handler.tags = ['tools']
handler.command = ['tomp3', 'toaudio']

export default handler
