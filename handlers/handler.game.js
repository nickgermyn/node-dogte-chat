/**
 * Dota game organisation handlers
 */

'use strict';

var Game = require('../models/game');
const noGame = 'No game scheduled for today';

module.exports = function(bot) {

  // *****************************
  //    Game creation / reschedule
  // *****************************
  bot.onText(/\/(dota|dogte|dotes) (.+)/, function(msg, match) {
    var chatId = msg.chat.id;
    var details = match[2];
    var userName = msg.from.username;

    // Parse dates and users
    var time = getTime(details);
    var gameTime = new Date();
    if(time) {
      gameTime.setHours(time.substring(0,2));
      gameTime.setMinutes(time.substring(2,4));
      gameTime.setSeconds(0);
    } else {
      gameTime.setHours(19);
      gameTime.setMinutes(30);
      gameTime.setSeconds(0);
    }

    // Find game
    Game.findOne({complete: false}, function(err, game) {
      if(err) return handleError(err, chatId);
      if(game) {
        // Update the existing game
        game.gameTime = gameTime;
        game.shotgun(userName);

        game.save(function(err) {
          if(err) return handleError(err, chatId);

          // Send message indicating so
          bot.sendMessage(chatId, 'Dogte time modified').then(function() {
            game.sendTimeUpdate(bot, chatId);
          });
        });

      } else {
        // Create a new game
        Game.create({
          gameTime: gameTime,
          complete: false,
          shotguns: [userName]
        }, function(err, createdItem) {
          if(err) return handleError(err, chatId);

          // Send message about game creation
          createdItem.sendTimeUpdate(bot, chatId);
        });
      }
    });
  });

  // *****************************
  //    Delete game
  // *****************************
  bot.onText(/\/delete (dota|dogte|dotes)/, function(msg) {
    var chatId = msg.chat.id;

    // Find game
    Game.findOne({complete: false}, function(err, game) {
      if(err) return handleError(err, chatId);
      if(game) {
        game.remove(function(err) {
          if(err) return handleError(err, chatId);
            bot.sendMessage(chatId, 'Dota event deleted');
        });
      } else {
        bot.sendMessage(chatId, noGame);
      }
    });
  });

  // *****************************
  //    shotgun
  // *****************************
  bot.onText(/shotgun\!/, function(msg) {
    var chatId = msg.chat.id;
    var userName = msg.from.username;

    // Find game
    Game.findOne({complete: false}, function(err, game) {
      if(err) return handleError(err, chatId);
      if(game) {
        game.shotgun(userName);

        game.save(function(err) {
          if(err) return handleError(err, chatId);

          // Send update
          game.sendShotgunUpdate(bot, chatId);
        });

      } else {
        bot.sendMessage(chatId, noGame);
      }
    });
  });

  // *****************************
  //    unshotgun
  // *****************************
  bot.onText(/unshotgun\!/, function(msg) {
    var chatId = msg.chat.id;
    var userName = msg.from.username;

    // Find game
    Game.findOne({complete: false}, function(err, game) {
      if(err) return handleError(err, chatId);
      if(game) {
        game.unshotgun(userName);

        game.save(function(err) {
          if(err) return handleError(err, chatId);

          // Send update
          bot.sendMessage(chatId, userName + ', your shotgun has been cancelled');
        });

      } else {
        bot.sendMessage(chatId, noGame);
      }
    });
  });

  // *****************************
  //    rdy!
  // *****************************
  bot.onText(/rdy\!/, function(msg) {
    var chatId = msg.chat.id;
    var userName = msg.from.username;

    // Find game
    Game.findOne({complete: false}, function(err, game) {
      if(err) return handleError(err, chatId);
      if(game) {
        var response = game.readyup(userName);

        game.save(function(err) {
          if(err) return handleError(err, chatId);

          // Send update
          game.sendReadyupUpdate(bot, chatId).then(function() {
            if(response.shotgun) {
                bot.sendMessage(chatId, '(... and I\'ve also shotgunned you)');
            }
          });
        });

      } else {
        bot.sendMessage(chatId, noGame);
      }
    });
  });

  // *****************************
  //    undry
  // *****************************
  bot.onText(/unrdy\!/, function(msg) {
    var chatId = msg.chat.id;
    var userName = msg.from.username;

    // Find game
    Game.findOne({complete: false}, function(err, game) {
      if(err) return handleError(err, chatId);
      if(game) {
        game.unreadyup(userName);

        game.save(function(err) {
          if(err) return handleError(err, chatId);

          // Send update
          bot.sendMessage(chatId, userName + ', your rdy has been cancelled');
        });

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
  // Time parser
  function getTime(msg) {
    var replaced = msg.replace(/:|\.|;|-/gi, '');
    var match = /at\s*(\w+)/.exec(replaced);
    if(match) {
      return match[1];
    } else {
      return null;
    }
  }
}