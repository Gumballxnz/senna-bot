#!/usr/bin/env node
import { createInterface } from 'readline'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import chalk from 'chalk'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = join(__dirname, '..')
const USER_CWD = process.cwd()
const CONFIG_PATH = join(USER_CWD, 'senna.config.js')

const [,, cmd, ...args] = process.argv

function ask(rl, question, fallback = '') {
    return new Promise(resolve => {
        const hint = fallback ? chalk.gray(` (padrão: ${fallback})`) : ''
        rl.question(`${question}${hint}: `, ans => {
            resolve(ans.trim() || fallback)
        })
    })
}

async function runInit() {
    console.log(chalk.cyan.bold('\n🏎️  Senna Bot — Setup Wizard\n'))

    const rl = createInterface({ input: process.stdin, output: process.stdout })

    const ownerNumber = await ask(rl, '📱 Seu número do WhatsApp (com código do país, sem +)', '')
    if (!ownerNumber || !/^\d{7,15}$/.test(ownerNumber)) {
        console.log(chalk.red('❌ Número inválido. Execute novamente e insira apenas dígitos (ex: 258879116693).'))
        rl.close()
        process.exit(1)
    }

    const ownerName = await ask(rl, '👤 Seu nome/apelido', 'Owner')
    const botName = await ask(rl, '🤖 Nome do bot', 'Senna Bot')
    const packname = await ask(rl, '🏷️  Nome do pack de stickers', `${botName}┃ᴮᴼᵀ`)
    const prefix = await ask(rl, '⌨️  Prefix dos comandos', '.')
    const enableBebot = await ask(rl, '🤖 Habilitar Sub-Bots (bebot)? (s/n)', 'n')

    rl.close()

    const configContent = `export default {
    owner: [['${ownerNumber}', '${ownerName}', true]],
    botName: '${botName}',
    packname: '${packname}',
    author: '${ownerName}',
    prefix: '${prefix}',
    botclone: ${enableBebot.toLowerCase() === 's' ? 'true' : 'false'},
}
`

    writeFileSync(CONFIG_PATH, configContent, 'utf-8')

    const gitignorePath = join(USER_CWD, '.gitignore')
    const gitignoreEntries = '\nsenna.config.js\nsessions/\nbebots/\ndatabase*.json\n'
    if (existsSync(gitignorePath)) {
        const existing = readFileSync(gitignorePath, 'utf-8')
        if (!existing.includes('senna.config.js')) {
            writeFileSync(gitignorePath, existing + gitignoreEntries, 'utf-8')
        }
    } else {
        writeFileSync(gitignorePath, gitignoreEntries.trim() + '\n', 'utf-8')
    }

    if (!existsSync(join(USER_CWD, 'sessions'))) mkdirSync(join(USER_CWD, 'sessions'), { recursive: true })
    if (!existsSync(join(USER_CWD, 'bebots'))) mkdirSync(join(USER_CWD, 'bebots'), { recursive: true })
    if (!existsSync(join(USER_CWD, 'tmp'))) mkdirSync(join(USER_CWD, 'tmp'), { recursive: true })

    console.log(chalk.green('\n✅ senna.config.js criado com sucesso!'))
    console.log(chalk.yellow('\n📋 Próximos passos:'))
    console.log(`  ${chalk.cyan('npx senna-bot pair')}   → Conectar ao WhatsApp`)
    console.log(`  ${chalk.cyan('npx senna-bot start')}  → Iniciar o bot\n`)
}

async function runPair() {
    if (!existsSync(CONFIG_PATH)) {
        console.log(chalk.red('❌ senna.config.js não encontrado. Execute primeiro: npx senna-bot init'))
        process.exit(1)
    }

    const { default: cfg } = await import(`file://${CONFIG_PATH}`)
    const number = args[0] || cfg?.owner?.[0]?.[0]

    if (!number) {
        console.log(chalk.red('❌ Número não encontrado. Use: npx senna-bot pair <número>'))
        process.exit(1)
    }

    process.env.SENNA_CWD = USER_CWD
    process.env.SENNA_PAIR_NUMBER = number

    const child = spawn(process.execPath, [join(PKG_ROOT, 'pair.js')], {
        stdio: 'inherit',
        env: { ...process.env }
    })
    child.on('exit', code => process.exit(code ?? 0))
}

async function runStart() {
    if (!existsSync(CONFIG_PATH)) {
        console.log(chalk.red('❌ senna.config.js não encontrado. Execute primeiro: npx senna-bot init'))
        process.exit(1)
    }

    process.env.SENNA_CWD = USER_CWD

    const child = spawn(process.execPath, [
        '--no-deprecation',
        '--max-old-space-size=512',
        join(PKG_ROOT, 'index.js')
    ], {
        stdio: 'inherit',
        cwd: USER_CWD,
        env: { ...process.env }
    })
    child.on('exit', code => process.exit(code ?? 0))
}

function showVersion() {
    const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf-8'))
    console.log(`senna-bot v${pkg.version}`)
}

function showHelp() {
    console.log(chalk.cyan.bold('\n🏎️  Senna Bot CLI\n'))
    console.log(`  ${chalk.white('npx senna-bot init')}     Setup inicial (wizard interativo)`)
    console.log(`  ${chalk.white('npx senna-bot pair')}     Conectar ao WhatsApp`)
    console.log(`  ${chalk.white('npx senna-bot start')}    Iniciar o bot`)
    console.log(`  ${chalk.white('npx senna-bot version')}  Exibir versão\n`)
}

switch (cmd) {
    case 'init':    runInit(); break
    case 'pair':    runPair(); break
    case 'start':   runStart(); break
    case 'version': showVersion(); break
    default:        showHelp()
}
