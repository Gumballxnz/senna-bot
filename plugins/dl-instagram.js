
import fg from 'fg-senna'
let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  
if (!args[0]) throw `✳️ Insira un Link de Instagram`
  m.react(rwait)

  try {
    let res = await fg.igdl(args[0])
     conn.sendFile(m.chat, res.dl_url, 'fb.mp4', `✅ Resultado`, m, null, fwc)
    m.react(done)
  } catch (error) {
    m.reply("error tente de novo mais tarde") 
  }
}
handler.help = ['instagram'].map(v => v + ' <url>')
handler.tags = ['dl']
handler.command = ['igdl', "instagramdl", "instagram"]
handler.diamond = true

export default handler
