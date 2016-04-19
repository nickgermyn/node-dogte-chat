/**
 * Help / utility related handlers
 */

'use strict';

var fs = require('fs');
var readMe = require('../resources/ReadMeMessage.md');

module.exports = function(bot) {
  // My Id
  bot.onText(/\/myid/, function(msg) {
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, msg.from.id);
  });

  // Echo
  bot.onText(/\/echo (.+)/, function(msg, match) {
    var chatId = msg.chat.id;
    var resp = match[1];
    bot.sendMessage(chatId, resp);
  });

  // Help
  bot.onText(/\/help/, function(msg) {
    var chatId = msg.chat.id;
    var resp = readMe;
    bot.sendMessage(chatId, resp, { parse_mode: 'Markdown'});
  });
}
