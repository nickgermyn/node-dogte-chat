/**
 * Dota game organisation handlers
 */

'use strict';

var Game = require('../models/game');
const noGame = 'No game scheduled for today';

module.exports = function(bot) {

  // Run funciton which repeats every X ms
  checkGame();

  // *****************************
  //    Checks for incomplete games that need cleanup
  // *****************************
  function checkGame() {
    console.log(' >checking game...');

    // Check for game
    Game.findOne({complete: false}, function(err, game) {
      if(err) return handleError(err, chatId);
      if(game && game.hasExpired()) {
        game.complete = true;
        game.save(function(err) {
          if(err) return handleError(err, chatId);
          console.log('game ' + game._id + ' cleaned up');
        });
      }

      if(game && game.shouldBeNotified()) {
        var timeToStart = game.timeToStart();
        bot.sendMessage(game.chatId, 'Dota will begin in '+timeToStart+'. Man up!');
        game.notified = true;
        game.save(function(err) {
          if(err) return handleError(err, chatId);
          console.log('game ' + game._id + ' notified');
        });
      }
    });

    setInterval(checkGame, 60000);
  }

  // *****************************
  // Error handler
  function handleError(err, chatId) {
    console.error(err);
  }
}
