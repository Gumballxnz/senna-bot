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

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('1/2  Publicando como: senna-bot (público global)')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
pkg.name = 'senna-bot'
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
run('npm publish --access public')

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('2/2  Publicando como: @gumballxnz/senna-bot (scoped)')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
pkg.name = '@gumballxnz/senna-bot'
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
run('npm publish --access public')

pkg.name = originalName
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

console.log('\n✅ Publicado nos dois registros npm!')
console.log('\nFormas de instalar:')
console.log('  npx senna-bot init')
console.log('  npx @gumballxnz/senna-bot init')
console.log('  npx github:Gumballxnz/senna-bot init')
