#!/usr/bin/env node
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const pkgPath = join(rootDir, 'package.json')
const npmrcPath = join(rootDir, '.npmrc')

const token = execSync('gh auth token', { encoding: 'utf-8' }).trim()
if (!token) {
    console.error('❌ Não foi possível obter o token do GitHub CLI.')
    process.exit(1)
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
const originalName = pkg.name
const originalPublishConfig = pkg.publishConfig

try {
    pkg.name = '@gumballxnz/senna-bot'
    pkg.publishConfig = { registry: 'https://npm.pkg.github.com' }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

    const npmrcContent = `@gumballxnz:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${token}\n`
    writeFileSync(npmrcPath, npmrcContent, 'utf-8')

    console.log('▶ Publicando @gumballxnz/senna-bot no GitHub Packages...')
    execSync('npm publish', { stdio: 'inherit', cwd: rootDir })
    console.log('✅ Publicado com sucesso no GitHub Packages!')
} finally {
    pkg.name = originalName
    if (originalPublishConfig) {
        pkg.publishConfig = originalPublishConfig
    } else {
        delete pkg.publishConfig
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    if (existsSync(npmrcPath)) unlinkSync(npmrcPath)
}
