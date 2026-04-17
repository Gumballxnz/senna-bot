module.exports = {
  apps: [{
    name: 'senna-bot',
    script: 'index.js',
    cwd: '/home/ubuntu/senna-bot',
    node_args: '--max-old-space-size=200 --expose-gc',
    max_memory_restart: '200M',
    autorestart: true,
    watch: false,
    kill_timeout: 3000,
    env: {
      NODE_ENV: 'production',
      TZ: 'Africa/Maputo'
    }
  }]
};
