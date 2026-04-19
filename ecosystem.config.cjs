module.exports = {
  apps: [{
    name: 'senna-bot',
    script: 'index.js',
    cwd: '/home/ubuntu/senna-bot',
    node_args: '--max-old-space-size=3072 --expose-gc',
    max_memory_restart: '3G',
    autorestart: true,
    watch: false,
    kill_timeout: 10000,
    env: {
      NODE_ENV: 'production',
      TZ: 'Africa/Maputo'
    }
  }]
};
