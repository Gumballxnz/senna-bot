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
const authFolder = path.join(__dirname, 'sessions')
const phoneNumber = '258871828596'

// Limpar sessão antiga
if (process.argv.includes('--clean')) {
    try {
        fs.rmSync(authFolder, { recursive: true, force: true })
        console.log('🧹 Pasta de sessões limpa com sucesso.')
    } catch (e) {}
}

if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true })
}

let pairingCodeRequested = false

async function connect() {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        version,
        browser: ['Chrome (Linux)', 'Chrome', '120.0.6099.199'],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        defaultQueryTimeoutMs: 300000,
        connectTimeoutMs: 60000
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            try {
                await qrcode.toFile(path.join(__dirname, 'qr.png'), qr)
            } catch (e) {}
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            console.log(`📡 Conexão encerrada com status ${statusCode}`)
            if (statusCode !== DisconnectReason.loggedOut && statusCode !== 403 && statusCode !== 401) {
                console.log('Reconectando para sincronizar chaves...')
                setTimeout(connect, 2000)
            } else {
                console.log('❌ Sessão rejeitada ou deslogada.')
                process.exit(1)
            }
        }

        if (connection === 'open') {
            console.log('\n========================================')
            console.log('🎉 BOT CONECTADO COM SUCESSO AO WHATSAPP!')
            console.log('⏳ Sincronizando chaves de autenticação...')
            console.log('========================================\n')
            
            setTimeout(() => {
                console.log('✅ Sessão salva no disco com sucesso!')
                process.exit(0)
            }, 6000)
        }
    })

    if (!sock.authState.creds.registered && !pairingCodeRequested) {
        pairingCodeRequested = true
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log('\n========================================')
                console.log(`📱 NÚMERO: +${phoneNumber}`)
                console.log(`🔑 CÓDIGO DE PAREAMENTO: ${code}`)
                console.log('========================================\n')
            } catch (err) {
                console.error('Erro ao gerar código:', err.message)
            }
        }, 3000)
    }
}

connect()
