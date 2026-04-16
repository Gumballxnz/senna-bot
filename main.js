
//-- process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import './config.js'; 
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
import path, { join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws';
import chalk from 'chalk'
import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch, rmSync } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import syntaxerror from 'syntax-error';
import { tmpdir } from 'os';
import { format } from 'util';

//import makeWASocket from '@whiskeysockets/baileys'
import { makeWASocket } from './lib/simple.js'
import { protoType, serialize } from './lib/simple.js'

import { Low, JSONFile } from 'lowdb';
import pino from 'pino';
import { mongoDB, mongoDBV2 } from './lib/mongoDB.js';
import store from './lib/store.js'
import readline from 'readline'




const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore, 
    jidNormalizedUser
   } = await import('@whiskeysockets/baileys')
import moment from 'moment-timezone'
import NodeCache from 'node-cache'
import fs from 'fs'
import qrcode from 'qrcode'
const { chain } = lodash

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') { return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString() }; global.__dirname = function dirname(pathURL) { return path.dirname(global.__filename(pathURL, true)) }; global.__require = function require(dir = import.meta.url) { return createRequire(dir) } 

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')
// global.Fn = function functionCallBack(fn, ...args) { return fn.call(global.conn, ...args) }
global.timestamp = {
  start: new Date
}

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[' + (opts['prefix'] || '‎./#!').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

//global.opts['db'] = "mongodb+srv://dbdyluxbot:password@cluster0.xwbxda5.mongodb.net/?retryWrites=true&w=majority"

global.db = new Low(
  /https?:\/\//.test(opts['db'] || '') ?
    new cloudDBAdapter(opts['db']) : /mongodb(\+srv)?:\/\//i.test(opts['db']) ?
      (opts['mongodbv2'] ? new mongoDBV2(opts['db']) : new mongoDB(opts['db'])) :
      new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}database.json`)
)


global.DATABASE = global.db 
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => {
    const intervalId = setInterval(async function () {
      if (!global.db.READ) {
        clearInterval(intervalId)
        resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
      }
    }, 1 * 1000)
  })
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {})
  }
  global.db.chain = chain(global.db.data)
}
loadDatabase()

//-- SESSION
global.authFile = `sessions`
const {state, saveState, saveCreds} = await useMultiFileAuthState(global.authFile)
const msgRetryCounterMap = new Map()
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
//const msgRetryCounterCache = new NodeCache()
const {version} = await fetchLatestBaileysVersion()

const connectionOptions = {
    logger: pino({ level: 'silent' }),
    version,
    browser: ['Mac OS', 'Chrome', '121.0.6167.159'],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: 'fatal' })
        ),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    msgRetryCounterCache,
    userDevicesCache,
    getMessage: async (key) => {
        let jid = jidNormalizedUser(key.remoteJid);
        let msg = await store.loadMessage(jid, key.id);
        return msg?.message || "";
    }    
};

global.conn = makeWASocket(connectionOptions)

store.bind(conn)
conn.store = store

conn.ev.on('creds.update', saveCreds)

//-- 
// O método de emparelhamento por número foi substituído pelo scanner de QR Code.
//--
if (!state.creds.registered) {
    let phoneNumber = "258876615436"
    setTimeout(async () => {
        try {
            let code = await conn.requestPairingCode(phoneNumber)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            console.log(chalk.green('\n📱 CÓDIGO DE PAREAMENTO: ' + chalk.bold(code) + '\n'))
        } catch (e) {
            console.error('Erro ao gerar código de pareamento: ', e)
        }
    }, 4000)
}

conn.isInit = false



if (!opts['test']) {
  setInterval(async () => {
    if (global.db.data) await global.db.write().catch(console.error)
    try {
      clearTmp()
    } catch (e) { console.error(e) }
  }, 60 * 1000)
}


/* Clear */
async function clearTmp() {
  const tmp = [tmpdir(), join(__dirname, './tmp')]
  const filename = []
  
  tmp.forEach(dirname => {
    if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true })
    readdirSync(dirname).forEach(file => filename.push(join(dirname, file)))
  })

  return filename.map(file => {
    try {
      const stats = statSync(file)
      if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 1)) return unlinkSync(file) // 1 minuto
    } catch (e) {}
    return false
  })
}

// Auto clear tmp interval incondicional removido (Evita dupla limpeza, agora usa o da linha 196)



async function connectionUpdate(update) {
  const { connection, lastDisconnect, qr } = update

  if (qr) {
    qrcode.toString(qr, { type: 'terminal', small: true }, function (err, str) {
      if (!err) {
        console.log('\n' + str)
        console.log('📱 ESCANEIE O QR CODE ACIMA NO SEU WHATSAPP!\n')
      }
    })
  }

  if (connection === 'close') {
    const statusCode = lastDisconnect?.error?.output?.statusCode
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut

    if (shouldReconnect) {
      console.log(`♻ Reconectando... (código: ${statusCode || 'desconhecido'})`)
      // Aguardar 3 segundos antes de reconectar para evitar flood
      await new Promise(r => setTimeout(r, 3000))
      global.reloadHandler(true)
    } else {
      console.log('❌ Sessão expirada! Limpando sessão antiga e reiniciando...')
      // Limpar sessão corrompida automaticamente
      const { rmSync } = await import('fs')
      try { rmSync('./sessions', { recursive: true, force: true }) } catch {}
      // Reiniciar o processo para gerar novo código de pareamento
      console.log('🔄 Reiniciando processo em 5 segundos...')
      setTimeout(() => process.exit(0), 5000)
    }
  }

  if (connection === 'open') {
    console.log('🟢 BOT CONECTADO')
    // Salvar sessão imediatamente ao conectar
    if (global.db.data) await global.db.write().catch(console.error)
  }
} //-- cu 

process.on('uncaughtException', console.error)
// let strQuot = /(["'])(?:(?=(\\?))\2.)*?\1/

let isInit = true;
let handler = await import('./handler.js')
global.reloadHandler = async function (restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (e) {
    console.error(e)
  }

 if (restatConn) {
  try { global.conn.ws.close() } catch {}
  conn.ev.removeAllListeners()

  global.conn = makeWASocket(connectionOptions)

store.bind(global.conn)
global.conn.store = store

  global.conn.ev.on('creds.update', saveCreds)

  isInit = true
}

  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('group-participants.update', conn.participantsUpdate)
    conn.ev.off('groups.update', conn.groupsUpdate)
    conn.ev.off('message.delete', conn.onDelete)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  conn.welcome = 'Olá, @user\nBem-vindo(a) ao grupo @group 🎉'
  conn.bye = 'Adeus @user 👋'
  conn.spromote = '@user agora é administrador 🛡️'
  conn.sdemote = '@user já não é administrador'
  conn.sDesc = '📝 *A descrição do grupo foi atualizada:*\n\n@desc'
  conn.sSubject = '📢 *O nome do grupo mudou para:*\n\n@group'
  conn.sIcon = '🖼️ *A foto do grupo foi atualizada.*'
  conn.sRevoke = '🔗 *O link do grupo foi redefinido:*\n\n@revoke'
  conn.handler = handler.handler.bind(global.conn)
  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn)
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn)
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn, true)

  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('group-participants.update', conn.participantsUpdate)
  conn.ev.on('groups.update', conn.groupsUpdate)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)
    
  conn.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
        try {
            await handler.deleteUpdate.call(conn, update)
        } catch (e) {
            console.error('Error en delete listener:', e)
        }
    }
})

  isInit = false
  return true
}


const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}


//-----
async function filesInit() {
  const start = Date.now()

  let ok = 0
  let fail = 0

  if (!fs.existsSync(pluginFolder)) {
    fs.mkdirSync(pluginFolder, { recursive: true })
  }

  for (let filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      let file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
      ok++
    } catch (e) {
      console.log(chalk.red(`❌ Error en ${filename}`))
      fail++
      delete global.plugins[filename]
    }
  }

  const end = Date.now()

  console.log(
    chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━') + '\n' +
    chalk.white('📦 Plugins detectados: ') + chalk.bold(ok + fail) + '\n' +
    chalk.green('🟢 Correctos: ') + chalk.bold.green(ok) + '\n' +
    chalk.red('🔴 Con error: ') + chalk.bold.red(fail) + '\n' +
    chalk.magenta('⚡ Tiempo: ') + chalk.bold.magenta(`${end - start}ms`) + '\n' +
    chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━')
  )
}

filesInit()
//filesInit().then(_ => console.log(Object.keys(global.plugins))).catch(console.error)
//-----

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED:', err)
})

///--
global.reload = async (_ev, filename) => {
  if (!pluginFilter(filename)) return

  const start = Date.now()
  const filePath = join(pluginFolder, filename)
  const dir = global.__filename(filePath, true)

  const isExisting = filename in global.plugins
  const exists = existsSync(dir)

  try {
    // 🗑 Plugin eliminado
    if (!exists) {
      if (isExisting) {
        delete global.plugins[filename]
        console.log(chalk.red(`🗑 Plugin eliminado → ${filename}`))
      }
      return
    }

    // 🔍 Validar sintaxis antes de importar
    const code = readFileSync(dir, 'utf8')
    const err = syntaxerror(code, filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true
    })

    if (err) {
  const { line, column, message } = err

  // Obtener líneas del código
  const lines = code.split('\n')
  const errorLine = lines[line - 1]

  console.log(
    chalk.red.bold(`❌ Error de sintaxis en ${filename}`) +
    `\n${chalk.yellow(`📍 Línea: ${line}, Columna: ${column}`)}` +
    `\n${chalk.gray(message)}` +
    `\n\n${chalk.white(errorLine)}` +
    `\n${' '.repeat(column - 1)}${chalk.red('^')}`
  )

  return
}

    // ♻ Import dinámico con cache-bust
    const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
    global.plugins[filename] = module.default || module

    const end = Date.now()

    if (isExisting) {
      console.log(
        chalk.cyan(`♻ Plugin recargado → ${filename}`) +
        chalk.gray(` (${end - start}ms)`)
      )
    } else {
      console.log(
        chalk.green(`✨ Nuevo plugin → ${filename}`) +
        chalk.gray(` (${end - start}ms)`)
      )
    }

  } catch (e) {
    console.log(
      chalk.red.bold(`❌ Error cargando ${filename}`) +
      '\n' +
      chalk.gray(e.message)
    )
  } finally {
    // 🔤 Ordenar plugins alfabéticamente
    global.plugins = Object.fromEntries(
      Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
    )
  }
}
//---

Object.freeze(global.reload)
watch(pluginFolder, global.reload)
await global.reloadHandler()

// Quick Test
async function _quickTest() {
  const start = Date.now()

  const check = (cmd, args = []) => {
    return new Promise(resolve => {
      const p = spawn(cmd, args)
      p.on('close', code => resolve(code !== 127))
      p.on('error', () => resolve(false))
    })
  }

  const [ffmpeg, ffmpegWebp, convert, magick, gm] = await Promise.all([
    check('ffmpeg'),
    check('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    check('convert'),
    check('magick'),
    check('gm')
  ])

  const imageMagick = convert || magick || gm

  global.support = Object.freeze({
    ffmpeg,
    ffmpegWebp,
    imageMagick
  })

  const end = Date.now()

  console.log(
    chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━') + '\n' +
    chalk.yellow.bold('🔎 SISTEMA CHECK') + '\n' +
    chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━') + '\n' +
    `🎬 FFmpeg        : ${ffmpeg ? chalk.green('✔ OK') : chalk.red('✖ FAIL')}\n` +
    `🖼 WebP Support  : ${ffmpegWebp ? chalk.green('✔ OK') : chalk.red('✖ FAIL')}\n` +
    `🧰 ImageMagick   : ${imageMagick ? chalk.green('✔ OK') : chalk.red('✖ FAIL')}\n` +
    chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━') + '\n' +
    chalk.magenta(`⚡ Tiempo: ${end - start}ms`) + '\n' +
    chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━')
  )

  // Advertencias solo si algo falla
  if (!ffmpeg)
    conn.logger.warn('Instala FFmpeg para enviar videos.')

  if (ffmpeg && !ffmpegWebp)
    conn.logger.warn('FFmpeg no tiene soporte WebP (stickers animados pueden fallar).')

  if (!imageMagick)
    conn.logger.warn('Instala ImageMagick o GraphicsMagick para stickers.')
}
//--

_quickTest()
  .then(() => console.log('✅ Prueba rápida realizada!'))
  .catch(console.error)