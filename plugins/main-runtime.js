let handler = async (m) => {
  let uptime = clockString(process.uptime() * 1000)
  m.reply(`🏮 *Tempo Ativo*\n\n${uptime}`, null, fwc)
}
handler.help = ['runtime']
handler.tags = ['main']
handler.command = ['runtime', 'uptime']
export default handler

function clockString(ms) {
  if (isNaN(ms) || ms < 0) ms = 0
  let d = Math.floor(ms / 86400000)
  let h = Math.floor(ms / 3600000) % 24
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${d}d ${h}h ${m}m ${s}s`
}
