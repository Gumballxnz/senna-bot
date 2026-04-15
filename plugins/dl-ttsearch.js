import fg from 'fg-senna'

let handler = async (m, { text }) => {
  if (!text) return m.reply('⚠️ Escreva algo para buscar en TikTok')

  try {
    const res = await fg.ttsearch(text)
    const results = res.result

    const teks = results.map((v, i) => {
      return `🎬 *Resultado* ${i + 1}
📌 *Título:* ${v.title || 'Sin título'}
👤 *Autor:* ${v.author || 'Desconocido'}
🔗 *Link:* ${v.link || 'No disponible'}`
    }).join('\n━━━━━━━━━━━━━━\n')

    m.reply(teks)

  } catch (err) {
    m.reply('❌ Busca falhou de TikTok, tente mais tarde')
  }
}

handler.help = ['ttsearch']
handler.tags = ['dl']
handler.command = ['tiktoksearch', 'ttsearch', "tks"]

export default handler