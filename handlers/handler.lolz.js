/**
 * Dota game organisation handlers
 */

'use strict';

var Game = require('../models/game');
const noGame = 'No game scheduled today';

module.exports = function(bot) {

  // *****************************
  //    Stack query
  // *****************************
  bot.onText(/GAM!/, function(msg) {
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, '@Chicken_Lips GAM!');
  });

  // *****************************
  // Error handler
  function handleError(err, chatId) {
    console.error(err);
  }
}
