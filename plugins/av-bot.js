let handler = async (m, { conn}) => {

let name = await conn.getName(m.sender)
let av = `./src/mp3/${pickRandom(["criss", "andrea"])}.mp3`
let fg_logo = `https://i.ibb.co/1zdz2j3/logo.jpg`

conn.sendButton(m.chat, `Hola *${name}*\n`, global.fg_ig, null, [
      ['⦙☰ Menu', '/help'],
      ['⦙☰ Menu 2', '/menu2'],
      [`⌬ Grupos`, '/gpdylux']
    ], m)

    conn.sendFile(m.chat, av, 'audio.ogg', '', m, true, { asAudio: true, ptt: false})

}

handler.customPrefix = /^(seven|dylux)$/i
handler.command = new RegExp

export default handler

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())]
}
