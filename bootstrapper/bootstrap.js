var express = require('express'),
    http = require('http'),
    shell = require('./shellHelper'),
    app = express();
var child,
    port = 3011,
    cwd = '/opt/node-dogte-chat';

function updateApp(req, res) {
  console.log('Updating app...');
  shell.series([
    'git pull',
    'npm install',
    'systemctl restart nodeserver'
  ], function(err) {
    if(err) {
      console.error('an error occurred: ' + err);
      res.status(500).send(err);
    } else {
      console.log('update complete');
      res.send('ok.');
    }
  });
}

app.get('/', function(req, res) {
  return res.send('hello world');
});
app.post('/', updateApp);
http.createServer(app).listen(port, function() {
  console.log('Express server listening on port: ' + port);
});
