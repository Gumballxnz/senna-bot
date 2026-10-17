module.exports = {
  apps: [{
    name: 'senna-bot',
    script: 'main.js',
    cwd: '/root/senna-bot',
    node_args: '--max-old-space-size=512 --expose-gc',
    max_memory_restart: '800M',
    autorestart: true,
    watch: false,
    kill_timeout: 10000,
    env: {
      NODE_ENV: 'production',
      TZ: 'Africa/Maputo'
    }
  }]
};
