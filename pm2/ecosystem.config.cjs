module.exports = {
  apps: [
    {
      name: 'kibastack-app',
      script: './pm2/start.sh',
      interpreter: '/bin/bash',
      autorestart: true,
      watch: false,
      out_file: './logs/dev-server-out.log',
      error_file: './logs/dev-server-error.log',
      merge_logs: true,
    },
    {
      name: 'kibastack-worker',
      script: './pm2/start.worker.sh',
      interpreter: '/bin/bash',
      autorestart: true,
      watch: false,
      out_file: './logs/dev-worker-out.log',
      error_file: './logs/dev-worker-error.log',
      merge_logs: true,
    },
  ],
}
