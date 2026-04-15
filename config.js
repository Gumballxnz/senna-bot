
import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.owner = [
  ['258879116693', '🇯🇵𝙶𝙷𝙾𝚂𝚃 𝙶𝚄𝙼𝙱𝙰𝙻𝙻 ╰⁔╯', true],
  ['258877656122', '🇯🇵𝙶𝙷𝙾𝚂𝚃 𝙶𝚄𝙼𝙱𝙰𝙻𝙻 ╰⁔╯', true]
] //Numeros de owner 

global.mods = ['']
global.prems = ['50999079501', '573166917092']
global.botNumber = ['']  //-- numero del bot
global.APIs = { // API Prefix
  // name: 'https://website' 
  fg_ss: 'https://fg-ss.ddns.net',
  fgmods: 'https://api.fgmods.xyz'
  //fgmods: 'https://api-fgmods.ddns.net'
}
global.APIKeys = { // APIKey Here
  // 'https://website': 'apikey'
  'https://api.fgmods.xyz': 'shen' //--- Regístrese en https://api.fgmods.xyz/
}

// Sticker WM
global.packname = 'DYLUX BOT S2┃ᴮᴼᵀ'
global.author = '🇯🇵𝙶𝙷𝙾𝚂𝚃 𝙶𝚄𝙼𝙱𝙰𝙻𝙻 ╰⁔╯'

//--info FG
global.botName = 'DYLUX BOT S2'
global.fg_ig = 'https://www.instagram.com/wotersan1?igsh=MWluaWl0OXd5aHdlOA=='
global.fg_sc = 'https://github.com/Gumballxnz'
global.fg_yt = 'https://www.youtube.com/@wotersangumball'
global.fg_pyp = 'fbilionario01@gmail.com'
global.fg_tt = 'https://www.tiktok.com/@gumballwotersan?_r=1&_t=ZS-95ZKTQCKz45'
global.fg_logo = 'https://i.ibb.co/1zdz2j3/logo.jpg'
global.fg_avatar = 'https://raw.githubusercontent.com/fg-error/fg-team/refs/heads/main/discord/avatar.png'

//--- Grupos WA
global.id_canal = '120363177092661333@newsletter' //-ID de canal de WhatsApp
global.canal_log = 'https://chat.whatsapp.com/FYoyZjNa2geKu5r20b3WS4?mode=gi_t'
global.canal_logid = '120363398698937291@newsletter'
global.fg_canal = 'https://chat.whatsapp.com/FYoyZjNa2geKu5r20b3WS4?mode=gi_t'
global.fg_group = 'https://chat.whatsapp.com/FYoyZjNa2geKu5r20b3WS4?mode=gi_t'
global.fg_gpnsfw = 'https://chat.whatsapp.com/FYoyZjNa2geKu5r20b3WS4?mode=gi_t' //--GP NSFW

//--emojis
global.rwait = '⌛'
global.dmoji = '🤭'
global.done = '✅'
global.error = '❌'
global.xmoji = '🔥'

global.multiplier = 69

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${import.meta.url}?update=${Date.now()}`)
})
