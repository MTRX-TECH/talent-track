module.exports = {
  apps: [
    {
      name: 'talenttrack-saas',
      script: './server.js',
      instances: 'max', // Run in cluster mode using all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      merge_logs: true,
      time: true
    }
  ]
};
