import fg from 'fg-senna'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) throw `📌 Exemplo :\n*${usedPrefix + command}* https://twitter.com/fernandavasro/status/1569741835555291139?t=ADxk8P3Z3prq8USIZUqXCg&s=19`
    m.react('⏳')
    
    try {
        let success = false
        // Extrair ID do tweet 
        let tweetIdMatch = args[0].match(/\/status\/(\d+)/);
        let directUrl = null;
        let descStr = '';

        if (!tweetIdMatch) throw new Error('Link do Twitter inválido ou sem ID do post.');

        const fetch = (await import('node-fetch')).default;
        let id = tweetIdMatch[1];

        // Camada 1: VX Twitter API (Native Discord Embed proxy - 100% Rate Limit Free)
        try {
            let vx = await fetch(`https://api.vxtwitter.com/Twitter/status/${id}`).then(v => v.json());
            
            if (vx && vx.media_extended && vx.media_extended.length > 0) {
                let videoMedia = vx.media_extended.find(m => m.type === 'video');
                if (videoMedia) directUrl = videoMedia.url;
                descStr = vx.text || '';
            } else if (vx && vx.mediaURLs && vx.mediaURLs.length > 0) {
                directUrl = vx.mediaURLs[0];
                descStr = vx.text || '';
            }
            
            if (directUrl) {
                let te = descStr ? `\n▢ *Desc:* ${descStr}` : '';
                await conn.sendFile(m.chat, directUrl, 'twitter.mp4', `✅ *Twitter/X*${te}`, m, null, { asDocument: false })
                success = true
            }
        } catch(e) {
            console.error('[Twitter Debug] vxTwitter falhou:', e.message)
        }

        // Camada 2: fxTwitter API (Fallback Mágico Secundário)
        if (!success) {
            try {
                let fx = await fetch(`https://api.fxtwitter.com/Twitter/status/${id}`).then(v => v.json());
                
                let videoMedia = fx?.tweet?.media?.video;
                if (videoMedia && videoMedia.url) { directUrl = videoMedia.url; }
                descStr = fx?.tweet?.text || '';

                if (directUrl) {
                    let te = descStr ? `\n▢ *Desc:* ${descStr}` : '';
                    await conn.sendFile(m.chat, directUrl, 'twitter.mp4', `✅ *Twitter/X*${te}`, m, null, { asDocument: false })
                    success = true
                }
            } catch(e) {
                console.error('[Twitter Debug] fxTwitter falhou:', e.message)
            }
        }

        if (!success) throw new Error('Falha global nas engrenagens de bypass do Twitter.')

        m.react('✅')
    } catch (error) {
        console.error('Twitter DL Error:', error.message)
        m.react('❌')
        m.reply("❎ Erro ao baixar Twitter.")
    }
}
handler.help = ['twitter'].map(v => v + ' <url>')
handler.tags = ['dl']
handler.command = ['twitter', 'tw', 'x']
handler.diamond = true

export default handler
