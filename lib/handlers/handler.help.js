/**
 * Help / utility related handlers
 */

'use strict';

var readMe = require('../resources/ReadMeMessage.md');

module.exports = function(bot) {
  // My Id
  bot.onText(/^\/myid(?:@\w*)?\b/i, function(msg) {
    var chatId = msg.chat.id;
    return bot.sendMessage(chatId, msg.from.id);
  });

  // Echo
  bot.onText(/^\/echo(?:@\w*)?\b\s*(.+)/i, function(msg, match) {
    var chatId = msg.chat.id;
    var resp = match[1];
    return bot.sendMessage(chatId, resp);
  });

  // Help
  bot.onText(/^\/help(?:@\w*)?/i, function(msg) {
    var chatId = msg.chat.id;
    var resp = readMe;
    return bot.sendMessage(chatId, resp, { parse_mode: 'Markdown'});
  });
};
