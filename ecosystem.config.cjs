module.exports = {
  apps: [{
    name: 'senna-bot',
    script: 'index.js',
    cwd: '/home/ubuntu/senna-bot',
    node_args: '--max-old-space-size=200',
    max_memory_restart: '250M',
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      TZ: 'Africa/Maputo'
    }
  }]
};
