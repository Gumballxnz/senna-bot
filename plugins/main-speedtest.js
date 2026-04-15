
import axios from 'axios'

let handler = async (m, { conn }) => {
    m.react('⏳')
    
    try {
        // Usaremos um arquivo de teste do Cloudflare/DigitalOcean que é estável
        const testUrl = 'https://speed.cloudflare.com/__down?bytes=15000000' // ~15MB
        const start = Date.now()
        
        const response = await axios({
            url: testUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 20000
        })

        let receivedBytes = 0
        response.data.on('data', (chunk) => {
            receivedBytes += chunk.length
        })

        await new Promise((resolve, reject) => {
            response.data.on('end', resolve)
            response.data.on('error', reject)
        })

        const end = Date.now()
        const durationSeconds = (end - start) / 1000
        const megaBits = (receivedBytes * 8) / (1024 * 1024)
        const speedMbps = megaBits / durationSeconds

        m.react('🚀')
        
        let txt = `*≡ SPEEDTEST (Cloudflare Engine)*\n\n`
        txt += `▢ *Velocidade:* ${speedMbps.toFixed(2)} Mbps\n`
        txt += `▢ *Servidor:* Cloudflare Edge\n`
        txt += `▢ *Transfereido:* ${(receivedBytes / (1024 * 1024)).toFixed(2)} MB\n`
        txt += `▢ *Tempo:* ${durationSeconds.toFixed(2)}s\n\n`
        txt += `_Teste realizado via Node.js nativo (sem tokens)_`

        await conn.reply(m.chat, txt, m)
        m.react('✅')

    } catch (e) {
        console.error('[SPEEDTEST] Erro:', e)
        m.reply(`❎ *Erro ao realizar teste de velocidade:* \`${e.message || e}\`\n\nTente novamente ou verifique a conexão do servidor.`)
        m.react('❌')
    }
}

handler.help = ['speedtest']
handler.tags = ['main']
handler.command = /^(speedtest|testspeed)$/i

export default handler
