import fg from 'fg-senna'

let free = 1000
let prem = 2000
let handler = async (m, { conn, args, isOwner, isPrems }) => {
  if (!args[0]) throw '✳️ Insira link do Mediafire'
  if (!args[0].match(/mediafire/gi)) throw '❎ Insira link do Mediafire'
  m.react(rwait)

  let limit = isPrems || isOwner ? prem : free

  try {
    let res = await fg.mediafire(args[0])
    let { url, filename, ext, aploud, size, sizeB } = res
    let isLimit = limit * 1024 * 1024 < sizeB
    let caption = `
   ≡ *MEDIAFIRE DL*

*📌 Nome:* ${filename}
*⚖️ Tamanho:* ${size}
*🔼 Subido:* ${aploud}
${isLimit ? `\n▢ Limite superado *+${free} MB* passe a premium para baixar até *${prem} MB*` : ''}
`.trim()

    await m.reply(caption)
    if (!isLimit) await conn.sendFile(m.chat, url, filename, '', m, null, { mimetype: ext, asDocument: true })
    m.react(done)
  } catch {
    m.reply('❌ Erro ao processar o link do Mediafire. Certifique-se de que é um link válido de arquivo.')
  }
}
handler.help = ['mediafire <url>']
handler.tags = ['dl', 'prem']
handler.command = ['mediafire', 'mfire']
handler.diamond = true
handler.premium = false

export default handler
