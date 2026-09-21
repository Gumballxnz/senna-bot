import {
    makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USER_CWD = process.env.SENNA_CWD || process.cwd()
const authFolder = path.join(USER_CWD, 'sessions')
const phoneNumber = process.env.SENNA_PAIR_NUMBER || ''

if (!phoneNumber) {
    console.error('❌ Número não configurado. Execute: npx senna-bot init')
    process.exit(1)
}

function cleanAuth() {
    try {
        if (fs.existsSync(authFolder)) {
            const files = fs.readdirSync(authFolder)
            for (const file of files) {
                fs.unlinkSync(path.join(authFolder, file))
            }
        } else {
            fs.mkdirSync(authFolder, { recursive: true })
        }
    } catch (e) {}
}

cleanAuth()

let isConnected = false
let isPairingCompleted = false

async function startPairingLoop() {
    if (isConnected) return

    const { state, saveCreds } = await useMultiFileAuthState(authFolder)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        version,
        browser: Browsers.ubuntu('Chrome'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        defaultQueryTimeoutMs: 120000,
        connectTimeoutMs: 60000
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr && !isPairingCompleted) {
            try {
                await qrcode.toFile(path.join(USER_CWD, 'qr.png'), qr)
            } catch (e) {}
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (!isConnected) {
                if (statusCode === 515) {
                    isPairingCompleted = true
                    console.log('\n🔄 WhatsApp confirmou o pareamento! Finalizando chaves de criptografia...')
                    setTimeout(startPairingLoop, 1500)
                } else {
                    console.log(`\n⏳ Conexão reiniciada (${statusCode || 'timeout'}). Atualizando código...`)
                    if (!isPairingCompleted) cleanAuth()
                    setTimeout(startPairingLoop, 2000)
                }
            }
        }

        if (connection === 'open') {
            isConnected = true
            console.log('\n==================================================')
            console.log('🎉 BOT CONECTADO COM SUCESSO AO WHATSAPP!')
            console.log('⏳ Gravando chaves de segurança no disco...')
            console.log('==================================================\n')

            setTimeout(() => {
                console.log('✅ Sessão gravada em ./sessions!')
                console.log('▶  Execute agora: npx senna-bot start')
                process.exit(0)
            }, 10000)
        }
    })

    if (!sock.authState.creds.registered && !isPairingCompleted) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log('\n========================================')
                console.log(`📱 NÚMERO: +${phoneNumber}`)
                console.log(`🔑 CÓDIGO DE PAREAMENTO: ${code}`)
                console.log('========================================\n')
            } catch (err) {}
        }, 3000)
    }
}

startPairingLoop()
