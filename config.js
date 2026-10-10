import { watchFile, unwatchFile, existsSync } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import { join } from 'path'

const USER_CWD = process.env.SENNA_CWD || process.cwd()
const userConfigPath = join(USER_CWD, 'senna.config.js')

let userCfg = {}
if (existsSync(userConfigPath)) {
    try {
        const mod = await import(`file://${userConfigPath}`)
        userCfg = mod.default || {}
    } catch (e) {
        console.warn(chalk.yellow(`⚠️  Erro ao carregar senna.config.js: ${e.message}`))
    }
}

// Configuração do dono (Owner):
// Adicione ou altere para o seu número com DDI (ex: 258... ou 55...), sem '+' nem espaços:
global.owner = userCfg.owner || [
    ['258879116693', '🇯🇵𝙶𝙷𝙾𝚂𝚃 𝙶𝚄𝙼𝙱𝙰𝙻𝙻 ╰⁔╯', true]
]
global.mods = userCfg.mods || []
global.prems = userCfg.prems || []
global.botNumber = userCfg.botNumber || ['258871828596']

global.APIs = {
    fg_ss: 'https://fg-ss.ddns.net',
    fgmods: 'https://api.fgmods.xyz',
    ...(userCfg.APIs || {})
}
global.APIKeys = {
    'https://api.fgmods.xyz': 'shen',
    ...(userCfg.APIKeys || {})
}

global.packname = userCfg.packname || 'Senna Bot┃ᴮᴼᵀ'
global.author = userCfg.author || ''
global.botName = userCfg.botName || 'Senna Bot'

global.fg_ig = userCfg.ig || 'https://github.com/Gumballxnz/senna-bot'
global.fg_sc = 'https://github.com/Gumballxnz'
global.fg_yt = userCfg.yt || ''
global.fg_pyp = userCfg.email || ''
global.fg_tt = userCfg.tt || ''
global.fg_logo = userCfg.logo || 'https://i.ibb.co/1zdz2j3/logo.jpg'
global.fg_avatar = userCfg.avatar || 'https://raw.githubusercontent.com/fg-error/fg-team/refs/heads/main/discord/avatar.png'

global.id_canal = userCfg.id_canal || ''
global.canal_log = userCfg.canal_log || ''
global.canal_logid = userCfg.canal_logid || ''
global.fg_canal = userCfg.fg_canal || ''
global.fg_group = userCfg.fg_group || ''
global.fg_gpnsfw = userCfg.fg_gpnsfw || ''

global.rwait = '⌛'
global.dmoji = '🤭'
global.done = '✅'
global.error = '❌'
global.xmoji = '🔥'

global.multiplier = userCfg.multiplier || 69

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'config.js'"))
    import(`${import.meta.url}?update=${Date.now()}`)
})
