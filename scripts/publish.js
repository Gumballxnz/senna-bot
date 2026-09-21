#!/usr/bin/env node
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgPath = join(__dirname, '..', 'package.json')

function run(cmd) {
    console.log(`\n▶ ${cmd}`)
    execSync(cmd, { stdio: 'inherit', cwd: join(__dirname, '..') })
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
const originalName = pkg.name

console.log('\n🏎️  Senna Bot — Dual Publish\n')
console.log(`📦 Versão: ${pkg.version}`)

const otpArg = process.argv.find(a => a.startsWith('--otp=')) || (process.argv.includes('--otp') ? `--otp=${process.argv[process.argv.indexOf('--otp') + 1]}` : '')
const otpFlag = otpArg ? ` ${otpArg}` : ''

try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1/2  Publicando como: senna-bot (público global)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    pkg.name = 'senna-bot'
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    run(`npm publish --access public${otpFlag}`)

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('2/2  Publicando como: @gumballwotersan/senna-bot (scoped)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    pkg.name = '@gumballwotersan/senna-bot'
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    run(`npm publish --access public${otpFlag}`)

    console.log('\n✅ Publicado com sucesso nos dois registros npm!')
} finally {
    pkg.name = originalName
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
}

console.log('\nFormas de instalar:')
console.log('  npx senna-bot init')
console.log('  npx @gumballwotersan/senna-bot init')
console.log('  npx github:Gumballxnz/senna-bot init')
