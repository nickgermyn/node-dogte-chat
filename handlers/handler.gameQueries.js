/**
 * Dota game organisation handlers
 */

'use strict';

var Game = require('../models/game');
var winston = require('winston');

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
      winston.info('handler.gameQueries - game query received');
      var chatId = msg.chat.id;

      // Find game
      return Game.findOne({complete: false}).exec()
        .then(game => {
          if(!game) { return bot.sendMessage(chatId, noGame); }
          return game.sendTimeUpdate(bot, chatId);
        }).catch(err => handleError(err, chatId));
    }
  });

  // *****************************
  //    Stack query
  // *****************************
  bot.onText(/(5\sstack|5stack|stacked|5mahn|5\smahn|5man|%mahn|%\smahn)/, function(msg) {
    winston.info('handler.gameQueries - stack query received');
    var chatId = msg.chat.id;
    var userName = msg.from.username;

    // Find game
    return Game.findOne({complete: false}).exec()
      .then(game => {
        if(!game) { return bot.sendMessage(chatId, noGame); }
        return game.sendStackUpdate(bot, chatId);
      }).catch(err => handleError(err, chatId));
  });

  // *****************************
  // Error handler
  function handleError(err, chatId, msg) {
    winston.error('An error occurred: ',err);
    msg = msg || 'Oh noes! An error occurred';
    return bot.sendMessage(chatId, msg+': \n'+err);
  }

  // *****************************
  // Regex array matcher
  function anyMatch(str, regs) {
    return regs.some(function(reg) {
      return reg.test(str);
    });
  }
}
