/**
 * Dota game organisation handlers
 */

'use strict';

var Game = require('../models/game');
const noGame = 'No game scheduled today';
var dotaQueries = [/any/, /when/, /happening/, /\?+/];
var dotaWords = [/dota/, /dogte/, /dotes/, /gam/];

module.exports = function(bot) {

  // *****************************
  //    Game query
  // *****************************
  bot.on('text', function(msg) {
    var txtLower = msg.text.toLowerCase();
    if(anyMatch(txtLower, dotaQueries) && anyMatch(txtLower, dotaWords)) {
      var chatId = msg.chat.id;

      // Find game
      Game.findOne({complete: false}, function(err, game) {
        if(err) return handleError(err, chatId);
        if(game) {
          game.sendTimeUpdate(bot, chatId);
        } else {
          bot.sendMessage(chatId, noGame);
        }
      });
    }
  });

  // *****************************
  //    Stack query
  // *****************************
  bot.onText(/(5\sstack|5stack|stacked|5mahn|5\smahn|5man|%mahn|%\smahn)/, function(msg) {
    var chatId = msg.chat.id;
    var userName = msg.from.username;

    // Find game
    Game.findOne({complete: false}, function(err, game) {
      if(err) return handleError(err, chatId);
      if(game) {
        game.sendStackUpdate(bot, chatId);
      } else {
        bot.sendMessage(chatId, noGame);
      }
    });
  });

  // *****************************
  // Error handler
  function handleError(err, chatId) {
    console.error(err);
  }

  // *****************************
  // Regex array matcher
  function anyMatch(str, regs) {
    return regs.some(function(reg) {
      return reg.test(str);
    });
  }
}
