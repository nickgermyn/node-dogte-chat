/**
 * Dota game organisation handlers
 */

'use strict';

var schedule = require('node-schedule');

var Game = require('../models/game');
const noGame = 'No game scheduled for today';

module.exports = {
  schedule: function(bot) {

    // Run funciton every 5 minutes on the minute
    var rule = new schedule.RecurrenceRule();
    rule.minute = [0, 5, 10, 15, 20, 25, 30, 35 ,40, 45, 50, 55];
    var j = schedule.scheduleJob(rule, checkGame);

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
          if(game.chatId) {
            bot.sendMessage(game.chatId, 'Dota will begin '+timeToStart+'. Man up!');
          }
          game.notified = true;
          game.save(function(err) {
            if(err) return handleError(err, chatId);
            console.log('game ' + game._id + ' notified');
          });
        }
      });
    }

    // *****************************
    // Error handler
    function handleError(err, chatId) {
      console.error(err);
    }
  }
}
