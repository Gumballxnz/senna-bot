# 🏎️ Senna Bot — WhatsApp Bot Inteligente & Modular

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=Gumballxnz&color=brightgreen" alt="Views" />
  <a href="https://github.com/Gumballxnz"><img title="Author" src="https://img.shields.io/badge/Dono-Gumball-blue?style=for-the-badge&logo=whatsapp"></a>
  <a href="https://github.com/Gumballxnz/senna-bot/stargazers/"><img title="Stars" src="https://img.shields.io/github/stars/Gumballxnz/senna-bot?style=social"></a>
  <a href="https://github.com/Gumballxnz/senna-bot/network/members"><img title="Fork" src="https://img.shields.io/github/forks/Gumballxnz/senna-bot?style=social"></a>
</p>

O **Senna Bot** é um assistente automatizado e modular para WhatsApp extremamente rápido e repleto de recursos. Ele foi desenvolvido em **Node.js** utilizando a biblioteca **WhiskeySockets Baileys**, sendo ideal tanto para uso pessoal em chats privados quanto para a administração completa de grupos de grande porte.

---

## 🌟 Principais Funcionalidades

O Senna Bot vem recheado de comandos separados por categorias:

1. **📥 Downloader Completo:**
   - Baixe vídeos do **Instagram (Reels e Posts)**, **TikTok** (sem marca d'água), **YouTube** (MP3/MP4), **Facebook** e muito mais.
   - Suporte a links diretos no chat.

2. **🛡️ Moderação de Grupos:**
   - Sistema inteligente de **Antilink**, **Antibot** e **Antispam**.
   - Comandos para banir, mutar, silenciar, alterar configurações do grupo e menção em massa (`.hidetag` / `.todos`).

3. **🎮 Economia e Jogos RPG (RPG/Minigames):**
   - Sistema de níveis (XP), banco de moedas, trabalho diário (`.work`), crimes (`.crime`), mineração (`.mine`) e loja virtual (`.shop`).
   - Jogos como roleta, dados e pedra-papel-tesoura contra o bot.

4. **🎨 Stickers (Figurinhas):**
   - Criação rápida de figurinhas a partir de fotos, vídeos e GIFs (`.s` / `.sticker`).
   - Customização de figurinhas com bordas ou textos.

5. **⚙️ Gestão de Sub-Bots (Bebots):**
   - Permite que outros usuários se conectem ao bot principal como "sub-bots" temporários (`.bebot`).

---

## ⚙️ Guia de Configuração (Para Iniciantes)

Antes de ligar o bot, você precisa colocar o seu número de telefone como o **Dono (Owner)**. Caso contrário, você não conseguirá rodar os comandos de administração global.

1. Abra o arquivo **`config.js`** localizado na raiz do projeto.
2. Procure pela linha `global.owner` (geralmente na linha 6):
   ```javascript
   global.owner = [
     ['SEUNUMERO', 'SEUNOME', true]
   ]
   ```
3. Substitua `'SEUNUMERO'` pelo seu número de WhatsApp com o código do país (ex: `258879116693` se for de Moçambique, ou `55119xxxxxxx` se for do Brasil), sem o símbolo de `+` nem traços.
4. Mude `'SEUNOME'` para o seu nome ou apelido.
5. Salve o arquivo.

---

## 🚀 Como Instalar e Rodar

### 📱 Método 1: Termux (No Celular Android)
Se você vai rodar o bot direto do seu celular, abra o Termux e digite os seguintes comandos um por um:

```sh
# 1. Atualizar pacotes do Termux
pkg upgrade -y && pkg update -y

# 2. Instalar as ferramentas básicas
pkg install git nodejs ffmpeg imagemagick -y

# 3. Baixar o projeto do GitHub
git clone https://github.com/Gumballxnz/senna-bot

# 4. Entrar na pasta do projeto
cd senna-bot

# 5. Instalar as dependências do Node.js
npm install

# 6. Iniciar o bot
npm start
```

---

### 💻 Método 2: Computador Local (Windows / Linux / macOS)
1. Certifique-se de ter o **[Node.js (versão 18 ou superior)](https://nodejs.org/)** instalado.
2. Certifique-se de ter o **[FFmpeg](https://ffmpeg.org/)** instalado e configurado nas variáveis de ambiente do seu sistema (necessário para conversão de mídias e stickers de vídeo).
3. Abra o terminal ou PowerShell na pasta do projeto e execute:
   ```sh
   # Instalar dependências
   npm install

   # Iniciar o bot
   npm start
   ```

---

### ☁️ Método 3: Hospedagem em VPS (Ubuntu / Debian)
Para deixar o bot rodando 24 horas por dia em um servidor na nuvem, recomendamos usar o gerenciador de processos **PM2**:

```sh
# 1. Instalar Node.js e FFmpeg no sistema
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm ffmpeg imagemagick -y

# 2. Instalar o PM2 globalmente
sudo npm install pm2 -g

# 3. Instalar as dependências na pasta do bot
npm install

# 4. Iniciar o bot usando PM2 para mantê-lo ativo
pm2 start index.js --name "senna-bot"

# 5. Salvar o processo do PM2
pm2 save
pm2 startup
```

---

## 📲 Como Conectar ao WhatsApp

Depois de executar `npm start` or `pm2 start`, o bot iniciará o processo de autenticação:

1. **Código de Pareamento (Pairing Code):** O terminal irá solicitar se você quer vincular por QR Code ou usando um Código de Pareamento direto no número de telefone.
2. Se escolher **Código de Pareamento**, digite o número do bot no terminal. Ele gerará um código de 8 caracteres (ex: `ABCD-1234`).
3. No celular que será o bot, vá em: **Aparelhos Conectados > Conectar um aparelho > Conectar com número de telefone**.
4. Digite o código gerado no terminal e pronto! O bot estará online.

---

## 📜 Licença

Este projeto está licenciado sob a **GNU General Public License v3.0 (GPL-3.0)** com termos adicionais.
Propriedade intelectual de **Gumball** (Copyright © 2026). Consulte o arquivo `LICENSE` para mais detalhes.

---

*Criado e mantido com ⚡ por **[Gumball](https://github.com/Gumballxnz)**.*
