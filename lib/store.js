import { readFileSync, writeFileSync, existsSync } from 'fs'
import {
    jidNormalizedUser,
    initAuthCreds,
    BufferJSON,
    proto
} from '@whiskeysockets/baileys'

function bind(conn) {
    if (!conn.chats) conn.chats = {}
    if (!conn.messages) conn.messages = {}

    const upsertChat = (id, data = {}) => {
        id = jidNormalizedUser(id)
        if (!id || id === 'status@broadcast') return
        conn.chats[id] = {
            ...(conn.chats[id] || {}),
            id,
            ...data
        }
    }

conn.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
        if (!msg?.key?.remoteJid || !msg.message) continue

        const jid = msg.key.remoteJid
        const id = msg.key.id

        if (!conn.messages[jid]) conn.messages[jid] = {}

        conn.messages[jid][id] = msg

        if (msg.key.participant) {
            conn.messages[jid][`${id}_${msg.key.participant}`] = msg
        }

        let keys = Object.keys(conn.messages[jid])
        if (keys.length > 25) {
            let toDelete = keys.length - 25
            for (let i = 0; i < toDelete; i++) {
                delete conn.messages[jid][keys[i]]
            }
        }
    }
})

    const updateContacts = (contacts) => {
        contacts = contacts?.contacts || contacts
        if (!contacts) return

        for (const contact of contacts) {
            const id = jidNormalizedUser(contact.id)
            if (!id || id === 'status@broadcast') continue

            const isGroup = id.endsWith('@g.us')

            upsertChat(id, {
                ...(isGroup
                    ? { subject: contact.subject || contact.name }
                    : { name: contact.notify || contact.name }
                )
            })
        }
    }

    conn.ev.on('contacts.upsert', updateContacts)
    conn.ev.on('contacts.update', updateContacts)
    conn.ev.on('contacts.set', updateContacts)

    conn.ev.on('chats.set', async ({ chats }) => {
        for (let { id, name, readOnly } of chats) {
            id = jidNormalizedUser(id)
            if (!id || id === 'status@broadcast') continue

            const isGroup = id.endsWith('@g.us')

            upsertChat(id, {
                isChats: !readOnly,
                ...(name && (isGroup ? { subject: name } : { name }))
            })

            if (isGroup) {
                const metadata = await conn.getGroupMetadata(id).catch(() => null)
                if (metadata) {
                    upsertChat(id, {
                        subject: metadata.subject,
                        metadata
                    })
                }
            }
        }
    })

    conn.ev.on('chats.upsert', (chats) => {
    if (!Array.isArray(chats)) return

    for (const chat of chats) {
        if (!chat?.id) continue
        const id = jidNormalizedUser(chat.id)
        upsertChat(id, { ...chat, isChats: true })
    }
})

    conn.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            const id = jidNormalizedUser(update.id)
            if (!id?.endsWith('@g.us')) continue

            let metadata = conn.chats[id]?.metadata

if (!metadata) {
    try {
        metadata = await conn.getGroupMetadata(id)
    } catch (e) {
        if (e?.data === 403) continue
        console.error(e)
        continue
    }
}

            upsertChat(id, {
                subject: update.subject || metadata.subject,
                metadata,
                isChats: true
            })
        }
    })

    conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            id = jidNormalizedUser(id)
            if (!id?.endsWith('@g.us')) return

            let metadata = conn.chats[id]?.metadata

         if (!metadata) {
         try {
            metadata = await conn.getGroupMetadata(id)
        } catch (e) {
        if (e?.data === 403) {
            console.log('⚠️ 403 - Sin acceso a metadata:', id)
            return
        }
        console.error(e)
        return
    }
}

            upsertChat(id, {
                subject: metadata.subject,
                metadata,
                isChats: true
            })

            console.log(`📢 Grupo ${metadata.subject} → ${action}`, participants)

        } catch (err) {
            console.error('group-participants.update error:', err)
        }
    })

    conn.ev.on('presence.update', ({ id, presences }) => {
        const sender = Object.keys(presences || {})[0]
        if (!sender) return

        const normalized = jidNormalizedUser(sender)
        const presence = presences[sender]?.lastKnownPresence || 'available'

        upsertChat(normalized, {
            presence
        })
    })

    conn.ev.on('messages.upsert', ({ messages }) => {
        for (const msg of messages) {
            if (!msg.messageStubType) continue

            const chatId = jidNormalizedUser(msg.key.remoteJid)
            const user = msg.messageStubParameters?.[0]

        }
    })
}

const KEY_MAP = {
    'pre-key': 'preKeys',
    'session': 'sessions',
    'sender-key': 'senderKeys',
    'app-state-sync-key': 'appStateSyncKeys',
    'app-state-sync-version': 'appStateVersions',
    'sender-key-memory': 'senderKeyMemory'
}

function useSingleFileAuthState(filename, logger) {
    let creds
    let keys = {}
    let saveCount = 0

    const saveState = (forceSave = false) => {
        saveCount++
        if (forceSave || saveCount > 5) {
            writeFileSync(
                filename,
                JSON.stringify({ creds, keys }, BufferJSON.replacer, 2)
            )
            saveCount = 0
        }
    }

    if (existsSync(filename)) {
        const result = JSON.parse(
            readFileSync(filename, 'utf-8'),
            BufferJSON.reviver
        )
        creds = result.creds
        keys = result.keys
    } else {
        creds = initAuthCreds()
        keys = {}
    }

    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const key = KEY_MAP[type]
                    return ids.reduce((dict, id) => {
                        let value = keys[key]?.[id]
                        if (value && type === 'app-state-sync-key') {
                            value = proto.AppStateSyncKeyData.fromObject(value)
                        }
                        if (value) dict[id] = value
                        return dict
                    }, {})
                },
                set: (data) => {
                    for (const type in data) {
                        const key = KEY_MAP[type]
                        keys[key] = keys[key] || {}
                        Object.assign(keys[key], data[type])
                    }
                    saveState()
                }
            }
        },
        saveState
    }
}

export default {
    bind,
    useSingleFileAuthState
}
