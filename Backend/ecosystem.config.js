// PM2 Ecosystem Config — Gossner College Admission Portal
// Usage:
//   pm2 start ecosystem.config.js       ← start in cluster mode
//   pm2 stop gossner-portal             ← stop
//   pm2 restart gossner-portal          ← restart
//   pm2 logs gossner-portal             ← live logs
//   pm2 monit                           ← live CPU/memory dashboard
//   pm2 save && pm2 startup             ← auto-restart on server reboot

module.exports = {
  apps: [
    {
      name: "gossner-portal",
      script: "server.js",

      // ─── Cluster Mode ─────────────────────────────────────────────
      // "max" = one process per CPU core
      // On a 4-core machine this gives you 4 Node processes,
      // solving the bcrypt event loop blocking problem
      instances: "max",
      exec_mode: "cluster",

      // ─── Auto Restart ──────────────────────────────────────────────
      watch: false,                  // Don't restart on file changes (production)
      max_memory_restart: "500M",    // Restart if memory exceeds 500MB

      // ─── Environment ──────────────────────────────────────────────
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // ─── Logs ─────────────────────────────────────────────────────
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,

      // ─── Crash Recovery ───────────────────────────────────────────
      min_uptime: "10s",             // Consider crashed if dies within 10s
      max_restarts: 10,              // Stop restarting after 10 crashes
    },
  ],
};
