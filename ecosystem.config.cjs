module.exports = {
  apps: [{
    name: 'senna-bot',
    script: 'index.js',
    cwd: '/home/ubuntu/senna-bot',
    node_args: '--max-old-space-size=4096 --expose-gc',
    max_memory_restart: '4G',
    autorestart: true,
    watch: false,
    kill_timeout: 10000,
    env: {
      NODE_ENV: 'production',
      TZ: 'Africa/Maputo'
    }
  }]
};
