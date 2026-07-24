
import fg from 'fg-senna'
import { downloadYT } from '../lib/ytHelper.js'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function before(m, { conn, isOwner }) {
    if (m.isBaileys || m.fromMe || !m.text) return false
    let chat = global.db.data.chats[m.chat]
    if (!chat || !chat.autodl) return false

    let text = m.text
    // Se a mensagem começa com um prefixo de comando, ignorar AutoDL
    // Isso evita o download duplo quando alguém usa .tiktok, .fb, etc.
    if (global.prefix.test(text)) return false

    const tiktokRegex = /https?:\/\/(www\.|v[mt]\.|vt\.)?tiktok\.com\/[^\s]*/i
    const facebookRegex = /https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.watch)\/[^\s]*/i
    const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\/[^\s]+|https?:\/\/instagr\.am\/[^\s]+/i
    const mediafireRegex = /https?:\/\/(www\.)?mediafire\.com\/file\/[^\s]*/i
    const megaRegex = /https?:\/\/mega\.nz\/file\/[^\s]*/i
    const youtubeRegex = /https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/[^\s]*/i
    const twitterRegex = /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s]+/i
    const pinterestRegex = /https?:\/\/(www\.)?(pinterest\.com\/pin|pin\.it)\/[^\s]*/i

    let found = false

    // TikTok (Cobalt / fg-senna)
    if (tiktokRegex.test(text)) {
        let link = text.match(tiktokRegex)[0]
        found = true
        m.react(rwait)
        try {
            let success = false
            
            // Tentativa 1: Cobalt API (Principal - Evita bloqueio)
            try {
                const { downloadCobalt } = await import('../lib/ytHelper.js')
                let cobaltRes = await downloadCobalt(link)
                if (cobaltRes) {
                    if (cobaltRes.isPicker) {
                        for (let url of cobaltRes.items) {
                            await conn.sendFile(m.chat, url, 'tiktok.png', '', m, null, fwc)
                        }
                        success = true
                        m.react(done)
                    } else if (fs.existsSync(cobaltRes.filePath)) {
                        await conn.sendFile(m.chat, cobaltRes.filePath, 'tiktok.mp4', `✅ *Auto DL: TikTok (Cobalt)*`, m, null, fwc)
                        if (fs.existsSync(cobaltRes.filePath)) fs.unlinkSync(cobaltRes.filePath)
                        success = true
                        m.react(done)
                    }
                }
            } catch (ee) {
                console.error('Cobalt TikTok failed, falling back to fg-senna...')
            }

            // Tentativa 2: fg-senna
            if (!success) {
                let data = await fg.tiktok(link)
                if (data && data.result && data.result.images) {
                    for (let img of data.result.images) {
                        await conn.sendFile(m.chat, img, 'tiktok.png', '', m, null, fwc)
                    }
                    success = true
                    m.react(done)
                } else if (data && data.result && data.result.play) {
                    await conn.sendFile(m.chat, data.result.play, 'tiktok.mp4', `✅ *Auto DL: TikTok*`, m, null, fwc)
                    success = true
                    m.react(done)
                }
            }

            // Tentativa 3: Local yt-dlp
            if (!success) {
                const TEMP_DIR = path.join(process.cwd(), 'tmp')
                if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
                const rawPath = path.join(TEMP_DIR, `tk_raw_${Date.now()}.mp4`)
                const finalPath = path.join(TEMP_DIR, `tk_${Date.now()}.mp4`)
                
                try {
                    await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${link}"`, { timeout: 120000 })
                    if (fs.existsSync(rawPath)) {
                        await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
                        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
                        if (fs.existsSync(finalPath)) {
                            await conn.sendFile(m.chat, finalPath, 'tiktok.mp4', `✅ *Auto DL: TikTok (HD)*`, m, null, fwc)
                            if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath)
                            success = true
                            m.react(done)
                        }
                    }
                } catch (ee) {
                    console.error('yt-dlp TikTok failed')
                }
            }

            if (!success) throw new Error('Não foi possível obter o link do vídeo TikTok')
        } catch (e) {
            console.error('AutoDL TikTok Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar TikTok: ${e.message}`)
        }
    }

    // Instagram (Híbrido)
    if (!found && instagramRegex.test(text)) {
        let link = text.match(instagramRegex)[0]
        found = true
        m.react(rwait)
        try {
            let data = await fg.igdl(link).catch(() => null)
            let success = false
            
            // Tentativa 1: Galeria / Mídia Única (Loop/Envio Direto da API)
            if (data?.result && data.result.length >= 1) {
                for (let i of data.result) {
                    await conn.sendFile(m.chat, i.url, 'instagram.mp4', `✅ *Auto DL: Instagram*`, m, null, fwc)
                }
                success = true
                m.react(done)
            } 
            
            // Tentativa 1.5: Cobalt API (Hospedado/Rápido) - Evita bloqueio de IP da VPS
            if (!success) {
                try {
                    const { downloadCobalt } = await import('../lib/ytHelper.js')
                    let cobaltRes = await downloadCobalt(link)
                    if (cobaltRes) {
                        if (cobaltRes.isPicker) {
                            // Carrossel de Imagens/Vídeos
                            for (let url of cobaltRes.items) {
                                await conn.sendFile(m.chat, url, 'instagram.mp4', `✅ *Auto DL: Instagram*`, m, null, fwc)
                            }
                            success = true
                            m.react(done)
                        } else if (fs.existsSync(cobaltRes.filePath)) {
                            // Mídia Única
                            await conn.sendFile(m.chat, cobaltRes.filePath, cobaltRes.title || 'instagram.mp4', `✅ *Auto DL: Instagram (Cobalt)*`, m, null, fwc)
                            if (fs.existsSync(cobaltRes.filePath)) fs.unlinkSync(cobaltRes.filePath)
                            success = true
                            m.react(done)
                        }
                    }
                } catch (e) {
                    console.error('❌ [AutoDL IG] Cobalt fallback failed:', e.message)
                }
            }
            
            // Tentativa 2: yt-dlp local (Alta Qualidade)
            if (!success) {
                const TEMP_DIR = path.join(process.cwd(), 'tmp')
                if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
                const rawPath = path.join(TEMP_DIR, `ig_raw_${Date.now()}.mp4`)
                const finalPath = path.join(TEMP_DIR, `ig_${Date.now()}.mp4`)

                try {
                    await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${link}"`, { timeout: 120000 })
                    if (fs.existsSync(rawPath)) {
                        await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
                        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
                        if (fs.existsSync(finalPath)) {
                            await conn.sendFile(m.chat, finalPath, 'ig.mp4', `✅ *Auto DL: Instagram (HD)*`, m, null, fwc)
                            if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath)
                            success = true
                        }
                    }
                } catch(e) {
                    console.error('❌ [AutoDL IG] yt-dlp falhou:', e.message)
                    try { if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath) } catch(_) {}
                    try { if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath) } catch(_) {}
                }
            }

            // Tentativa 3: APIs de Fallback
            if (!success) {
                const fetch = (await import('node-fetch')).default;
                let url = data?.dl_url || (data?.result && data.result[0]?.url)

                if (!url) {
                    try {
                        let rz = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(link)}`, { timeout: 10000 }).then(v => v.json()).catch(() => null);
                        url = rz?.url || rz?.data?.url || rz?.result?.[0]?.url;
                    } catch(e) {}
                }

                if (!url) {
                    try {
                        let sp = await fetch(`https://api.siputzx.my.id/api/d/instagram?url=${encodeURIComponent(link)}`, { timeout: 10000 }).then(v => v.json()).catch(() => null);
                        url = sp?.data?.[0]?.url || sp?.data?.url;
                    } catch(e) {}
                }

                if (url) {
                    try {
                        await conn.sendFile(m.chat, url, 'ig.mp4', `✅ *Auto DL: Instagram*`, m, null, fwc)
                        success = true
                    } catch(e) {
                        console.error('❌ [AutoDL IG] Envio da API falhou:', e.message)
                    }
                }
            }

            if (!success) throw new Error('Não foi possível obter a URL de download em nenhum motor.')
            m.react(done)
        } catch (e) {
            console.error('AutoDL Instagram Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar Instagram: ${e.message}`)
        }
    }

    // Facebook (Híbrido)
    if (!found && facebookRegex.test(text)) {
        let link = text.match(facebookRegex)[0]
        found = true
        m.react(rwait)
        try {
            let success = false
            
            // Tentativa 1: Cobalt API (Principal - Evita bloqueio de IP da VPS)
            try {
                const { downloadCobalt } = await import('../lib/ytHelper.js')
                let cobaltRes = await downloadCobalt(link)
                if (cobaltRes && !cobaltRes.isPicker && fs.existsSync(cobaltRes.filePath)) {
                    await conn.sendFile(m.chat, cobaltRes.filePath, cobaltRes.title || 'fb.mp4', `✅ *Auto DL: Facebook (Cobalt)*`, m, null, fwc)
                    if (fs.existsSync(cobaltRes.filePath)) fs.unlinkSync(cobaltRes.filePath)
                    success = true
                }
            } catch (ee) {
                console.error('Cobalt Facebook failed, falling back to APIs...')
            }

            // Tentativa 2: APIs de terceiros
            if (!success) {
                let url = null;
                try {
                    const fetch = (await import('node-fetch')).default;
                    
                    let sp = await fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(link)}`).then(v => v.json()).catch(() => null);
                    url = sp?.data?.url || sp?.data?.hd || sp?.data?.sd;

                    if (!url) {
                        let rz = await fetch(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(link)}`).then(v => v.json()).catch(() => null);
                        url = rz?.url || rz?.data?.url || rz?.result?.url_hd || rz?.result?.url_sd;
                    }

                    if (!url) {
                        let fgRes = await fg.fbdl(link).catch(() => null);
                        url = fgRes?.HD || fgRes?.SD;
                    }

                    if (url) {
                        await conn.sendFile(m.chat, url, 'fb.mp4', `✅ *Auto DL: Facebook*`, m, null, fwc)
                        success = true
                    }
                } catch (apiErr) {
                    console.error('Facebook DL API fallback failed, falling back to local tools:', apiErr.message)
                }
            }

            if (!success) {
                // Ligar o motor yt-dlp local (como último recurso)
                const TEMP_DIR = path.join(process.cwd(), 'tmp')
                if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
                const rawPath = path.join(TEMP_DIR, `fb_raw_${Date.now()}.mp4`)
                const finalPath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`)

                try {
                    await execAsync(`yt-dlp -f "b[vcodec^=avc]/b[vcodec^=h264]/hd/sd/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best" --merge-output-format mp4 -o "${rawPath}" "${link}"`, { timeout: 120000 })
                    if (fs.existsSync(rawPath)) {
                        let codec = 'h264'
                        try {
                            const { stdout } = await execAsync(`ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${rawPath}"`)
                            if (stdout) codec = stdout.trim()
                        } catch(e){}
                        
                        let ffmpegCmd = codec === 'h264' 
                            ? `ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`
                            : `ffmpeg -i "${rawPath}" -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`
            
                        await execAsync(ffmpegCmd, { timeout: 180000 })
                        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
                        if (fs.existsSync(finalPath)) {
                            await conn.sendFile(m.chat, finalPath, 'fb.mp4', `✅ *Auto DL: Facebook (HD)*`, m, null, fwc)
                            fs.unlinkSync(finalPath)
                            success = true
                        }
                    }
                } catch (ee) {
                    console.error('yt-dlp Facebook local failed:', ee.message)
                }
            }

            if (!success) throw new Error('Não foi possível baixar o Facebook através das APIs ou localmente')
            m.react(done)
        } catch (e) {
            console.error('AutoDL Facebook Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar Facebook: Verifique se o link é público.`)
        }
    }

    // Twitter/X (vxTwitter Speed Mode)
    if (!found && twitterRegex.test(text)) {
        let link = text.match(twitterRegex)[0]
        found = true
        m.react(rwait)
        try {
            let tweetIdMatch = link.match(/\/status\/(\d+)/);
            if (!tweetIdMatch) throw new Error('Link do Twitter inválido ou sem ID do post.');
            
            let id = tweetIdMatch[1];
            let directUrl = null;
            let success = false;
            const fetch = (await import('node-fetch')).default;

            // Camada 1: VX Twitter API
            try {
                let vx = await fetch(`https://api.vxtwitter.com/Twitter/status/${id}`).then(v => v.json());
                if (vx && vx.media_extended && vx.media_extended.length > 0) {
                    let videoMedia = vx.media_extended.find(xx => xx.type === 'video');
                    if (videoMedia) directUrl = videoMedia.url;
                } else if (vx && vx.mediaURLs && vx.mediaURLs.length > 0) {
                    directUrl = vx.mediaURLs[0];
                }
                
                if (directUrl) {
                    await conn.sendFile(m.chat, directUrl, 'twitter.mp4', `✅ *Auto DL: Twitter/X*`, m, null, fwc)
                    success = true;
                }
            } catch(e) { }

            // Camada 2: fxTwitter API
            if (!success) {
                try {
                    let fx = await fetch(`https://api.fxtwitter.com/Twitter/status/${id}`).then(v => v.json());
                    let videoMedia = fx?.tweet?.media?.video;
                    if (videoMedia && videoMedia.url) { directUrl = videoMedia.url; }

                    if (directUrl) {
                        await conn.sendFile(m.chat, directUrl, 'twitter.mp4', `✅ *Auto DL: Twitter/X (fxTwitter)*`, m, null, fwc)
                        success = true;
                    }
                } catch(e) { }
            }

            // Camada 3: Cobalt API Fallback (Evita falha global)
            if (!success) {
                try {
                    const { downloadCobalt } = await import('../lib/ytHelper.js')
                    let cobaltRes = await downloadCobalt(link)
                    if (cobaltRes) {
                        if (cobaltRes.isPicker) {
                            for (let url of cobaltRes.items) {
                                await conn.sendFile(m.chat, url, 'twitter.mp4', `✅ *Auto DL: Twitter/X (Cobalt)*`, m, null, fwc)
                            }
                            success = true;
                        } else if (fs.existsSync(cobaltRes.filePath)) {
                            await conn.sendFile(m.chat, cobaltRes.filePath, cobaltRes.title || 'twitter.mp4', `✅ *Auto DL: Twitter/X (Cobalt)*`, m, null, fwc)
                            if (fs.existsSync(cobaltRes.filePath)) fs.unlinkSync(cobaltRes.filePath)
                            success = true;
                        }
                    }
                } catch(e) { }
            }

            if (!success) throw new Error('Todas as conexões nativas do Twitter falharam.');
            m.react(done)
        } catch (e) {
            console.error('AutoDL Twitter Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao processar Twitter via Auto DL.`)
        }
    }

    // Mediafire (fg-senna)
    if (!found && mediafireRegex.test(text)) {
        let link = text.match(mediafireRegex)[0]
        found = true
        m.react(rwait)
        try {
            let data = await fg.mediafire(link)
            if (data.url) {
                let size = parseInt(data.size)
                if (size > 1024 && data.size.includes('MB') && !isOwner) return m.reply('✳️ Arquivo muito grande para AutoDL (Max 1GB). Use o comando .mediafire para limites de até 3GB.')
                await conn.sendFile(m.chat, data.url, data.filename, `✅ *Auto DL: Mediafire*`, m, null, { asDocument: true })
                m.react(done)
            }
        } catch (e) {
            console.error('AutoDL Mediafire Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar Mediafire: ${e.message}`)
        }
    }

    // MEGA (fg-senna)
    if (!found && megaRegex.test(text)) {
        let link = text.match(megaRegex)[0]
        found = true
        m.react(rwait)
        try {
            let data = await fg.mega(link)
            if (data.download) {
                await conn.sendFile(m.chat, data.download, data.filename, `✅ *Auto DL: MEGA*`, m, null, { asDocument: true })
                m.react(done)
            }
        } catch (e) {
            console.error('AutoDL MEGA Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar MEGA: ${e.message}`)
        }
    }

    // YouTube (ytHelper + yt-dlp)
    if (!found && youtubeRegex.test(text)) {
        let link = text.match(youtubeRegex)[0]
        found = true
        m.react(rwait)
        try {
            let { filePath, size, title } = await downloadYT(link, 'video')
            if (fs.existsSync(filePath)) {
                // Limite de 2GB (Limite do WhatsApp Document)
                if (size > 2000 * 1024 * 1024) {
                    fs.unlinkSync(filePath)
                    return m.reply('✳️ O arquivo superou o limite de 2GB do WhatsApp.')
                }

                await conn.sendFile(m.chat, filePath, `${title || 'video'}.mp4`, `✅ *Auto DL: YouTube (HD)*`, m, null, { asDocument: true })
                
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
                m.react(done)
            }
        } catch (e) {
            console.error('AutoDL YouTube Error:', e)
            m.react('❌')
            // Se o erro for upload, avisar especificamente
            if (e.message.includes('upload')) {
                m.reply(`❎ Erro de Transmissão: O ficheiro é muito grande ou a conexão com o WhatsApp caiu. Tente novamente.`)
            } else {
                m.reply(`❎ Erro ao baixar YouTube: ${e.message}`)
            }
        }
    }

    // Pinterest (Cobalt)
    if (!found && pinterestRegex.test(text)) {
        let link = text.match(pinterestRegex)[0]
        found = true
        m.react(rwait)
        try {
            const { downloadCobalt } = await import('../lib/ytHelper.js')
            let cobaltRes = await downloadCobalt(link)
            if (cobaltRes) {
                if (cobaltRes.isPicker) {
                    for (let url of cobaltRes.items) {
                        await conn.sendFile(m.chat, url, 'pinterest.png', `✅ *Auto DL: Pinterest*`, m, null, fwc)
                    }
                    m.react(done)
                } else if (fs.existsSync(cobaltRes.filePath)) {
                    await conn.sendFile(m.chat, cobaltRes.filePath, cobaltRes.title || 'pinterest.mp4', `✅ *Auto DL: Pinterest*`, m, null, fwc)
                    if (fs.existsSync(cobaltRes.filePath)) fs.unlinkSync(cobaltRes.filePath)
                    m.react(done)
                } else {
                    throw new Error('Nenhum arquivo retornado do Cobalt.')
                }
            } else {
                throw new Error('API do Cobalt offline.')
            }
        } catch (e) {
            console.error('AutoDL Pinterest Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar Pinterest: ${e.message}`)
        }
    }

    return found
}
