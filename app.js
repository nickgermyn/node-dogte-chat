/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var fs = require('fs');
var mongoose = require('mongoose');
var config = require('./lib/config/environment');
var TelegramBot = require('node-telegram-bot-api');
var Promise = require('bluebird');
var winston = require('winston');

// Custom extension handler
require.extensions['.md'] = function(module, fileName) {
  module.exports = fs.readFileSync(fileName, 'utf8');
};
// Setup log level
winston.level = 'debug';

// Connect to database
mongoose.Promise = Promise;
//mongoose.set('debug', true);
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
});

// Populate DB with sample data
if (config.seedDB) { require('./lib/config/seed'); }

// Setup the bot
var bot = new TelegramBot(config.telegram.token, config.telegram.options);
require('./lib/handlers')(bot);
require('./lib/tasks')(bot);

bot.getMe().then(function(me) {
  console.log('Hi my name is %s', me.username);
});

// Expose application
exports = module.exports = bot;
