// config for the express app
// depending on `process.env.NODE_ENV`, default is `development`

var path = require('path'),
    rootPath = path.normalize(__dirname + '/../..');

var config = {
  // Development config
  //
  development: {
    server: {
      port: 3001,
      hostname: 'localhost',
    },
    database: {
      url: 'mongodb://localhost/monbattle'
    },
    BaseApiURL : 'http://localhost:3001/api/',
    root     : rootPath,
    app      : {
      name : 'MonsterBattle'
    },
  },
  //
  // Production Config
  //
  production: {
    server: {
      port: 3001,
      hostname: process.env.HOSTNAME || '127.0.0.1',
    },
    database: {
      url: 'mongodb://localhost/monbattle'
    },
    BaseApiURL : 'http://localhost:3001/api/',
    root     : rootPath,
    app      : {
      name : 'MonsterBattle'
    },
  },

  //
  // Testing config
  //
  test: {
    server: {
      port: 4001,
      hostname: 'localhost',
    },
    database: {
      url: 'mongodb://localhost/monbattle_test'
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
