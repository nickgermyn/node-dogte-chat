/**
 * Dota game organisation handlers
 */

'use strict';

var Promise = require('bluebird');
var Game = require('../models/game');
var winston = require('winston');

const noGame = 'No game scheduled for today';

module.exports = function(bot) {

  // *****************************
  //    Game creation / reschedule
  // *****************************
  bot.onText(/\/(dota|dogte|dotes) (.+)/, function(msg, match) {
    winston.info('handler.game - game creation request received');
    var chatId = msg.chat.id;
    var details = match[2];
    var userName = msg.from.username;
    var displayName = msg.from.first_name;
    if(msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    // Parse dates and users
    var time = getTime(details);
    var gameTime = new Date();
    if(time) {
      gameTime.setHours(time.substring(0,2));
      gameTime.setMinutes(time.substring(2,4));
      gameTime.setSeconds(0);
    } else {
      // no valid time found, let the user know
      return bot.sendMessage(chatId, 'Unrecognised command. Usage example: `/dota at 1730`');
    }

    // Find game
    return Game.findOne({complete: false}).exec()
      .then(game => {
        if(game) {
          // Update the existing game
          winston.info(' Game already exists. Updating');
          game.gameTime = gameTime;
          game.notified = false;
          game.shotgun(displayName);

          winston.info(' saving...');
          return game.save()
            .then(saved => bot.sendMessage(chatId, 'Dogte time modified'))
            .then(sent => game.sendTimeUpdate(bot, chatId));
        } else {
          // Create a new game
          game = new Game({
            gameTime: gameTime,
            chatId: chatId,
            complete: false,
            shotguns: [displayName]
          });
          return game.save()
            .then(sent => game.sendTimeUpdate(bot, chatId));
        }
      }).catch(err => handleError(err, chatId));
  });

  // *****************************
  //    Delete game
  // *****************************
  bot.onText(/\/delete_(dota|dogte|dotes)/, function(msg) {
    winston.info('handler.game - game deletion request received');
    var chatId = msg.chat.id;

    // Find game
    var a = Game.findOne({complete: false}).exec();
    var b = a.then(game => {
      if(game) {
        var messageText = 'Are you sure you wish to delete the game at '+game.gameTime+' (yes/no)?';
        return bot.sendMessage(chatId, messageText, {
          reply_markup: {
            force_reply: true
          }
        });
      }
      return null;
    });

    return Promise.join(a, b, (game, sent) => {
      if(!sent) {
        return bot.sendMessage(chatId, noGame);
      }
      winston.info(' waiting for message reply');
      return bot.onReplyToMessage(chatId, sent.message_id, reply => {
        winston.info(' reply received: '+reply.text);
        if(reply.text == 'yes') {
          return Game.remove({ _id: game._id }).exec().then(() => {
            bot.sendMessage(chatId, 'Dota event deleted');
            winston.info(' dota event deleted!');
          });
        }
      });
    }).catch(err => handleError(err, chatId));
  });

  // *****************************
  //    shotgun
  // *****************************
  bot.onText(/\/shotgun/, function(msg) {
    winston.info('handler.game - shotgun received');
    var chatId = msg.chat.id;
    var userName = msg.from.username;
    var displayName = msg.from.first_name;
    if(msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    // Find game
    return Game.findOne({complete: false}).exec()
      .then(game => {
        if(!game) { return bot.sendMessage(chatId, noGame); }
        game.shotgun(displayName);

        return game.save()
          .then(saved => game.sendShotgunUpdate(bot, chatId));
      }).catch(err => handleError(err, chatId));
  });

  // *****************************
  //    unshotgun
  // *****************************
  bot.onText(/\/unshotgun/, function(msg) {
    winston.info('handler.game - unshotgun received');
    var chatId = msg.chat.id;
    var userName = msg.from.username;
    var displayName = msg.from.first_name;
    if(msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    // Find game
    return Game.findOne({complete: false}).exec()
      .then(game => {
        if(!game) { return bot.sendMessage(chatId, noGame); }

        game.unshotgun(displayName);
        return game.save()
          .then(saved => bot.sendMessage(chatId, displayName + ', your shotgun has been cancelled'));
      }).catch(err => handleError(err, chatId));
  });

  // *****************************
  //    rdy
  // *****************************
  bot.onText(/\/(rdy|ready)/, function(msg) {
    winston.info('handler.game - rdy received');
    var chatId = msg.chat.id;
    var userName = msg.from.username;
    var displayName = msg.from.first_name;
    if(msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    // Find game
    return Game.findOne({complete: false}).exec()
      .then(game => {
        if(!game) { return bot.sendMessage(chatId, noGame); }

        var response = game.readyup(displayName);
        return game.save()
          .then(saved => game.sendStackUpdate(bot, chatId));
      }).catch(err => handleError(err, chatId));
  });

  // *****************************
  //    undry
  // *****************************
  bot.onText(/\/un(rdy|ready)/, function(msg) {
    winston.info('handler.game - unrdy received');
    var chatId = msg.chat.id;
    var userName = msg.from.username;
    var displayName = msg.from.first_name;
    if(msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    // Find game
    return Game.findOne({complete: false}).exec()
      .then(game => {
        if(!game) { return bot.sendMessage(chatId, noGame); }

        game.unreadyup(displayName);
        return game.save()
          .then(saved => bot.sendMessage(chatId, displayName + ', your rdy has been cancelled'));
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
  // Time parser
  function getTime(msg) {
    var replaced = msg.replace(/:|\.|;|-/gi, '');
    var match = /(?:at)\s*(\d{4})/.exec(replaced);
    if(match) {
      return match[1];
    } else {
      return null;
    }
  }
}
