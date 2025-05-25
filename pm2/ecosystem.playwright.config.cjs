module.exports = {
  apps: [
    {
      name: 'kibastack-app-playwright',
      script: './pm2/start.playwright.sh',
      interpreter: '/bin/bash',
      autorestart: true,
      watch: false,
      out_file: './logs/dev-server-playwright-out.log',
      error_file: './logs/dev-server-playwright-error.log',
      merge_logs: true,
    },
    {
      name: 'kibastack-worker-playwright',
      script: './pm2/start.playwright.worker.sh',
      interpreter: '/bin/bash',
      autorestart: true,
      watch: false,
      out_file: './logs/dev-worker-playwright-out.log',
      error_file: './logs/dev-worker-playwright-error.log',
      merge_logs: true,
    },
  ],
}
