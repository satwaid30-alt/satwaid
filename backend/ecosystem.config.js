module.exports = {
    apps : [{
      name:'ms-paps-public',
      script: 'server.js',
      watch: false,
      instances: 1,
      exec_mode: 'cluster',
      ignore_watch: ['api/logapi','tmp','upload','node_modules','storage','storage/uploads','storage/data'],
    }],
  
    deploy : {
      production : {
        user : 'SSH_USERNAME',
        host : 'SSH_HOSTMACHINE',
        ref  : 'origin/master',
        repo : 'GIT_REPOSITORY',
        path : 'DESTINATION_PATH',
        'pre-deploy-local': '',
        'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
        'pre-setup': ''
      }
    }
  };
  