/**
 * Dota game organisation handlers
 */

'use strict';

var Promise = require('bluebird');
var Game = require('../models/game');
var winston = require('winston');

const noGame = 'No game scheduled for today';
const daysOfWeek = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

module.exports = function(bot) {

  // *****************************
  //    Game creation / reschedule
  // *****************************
  bot.onText(/^\/dog?t[ea]s?(?:@\w*)?\b\s*(?:(tomorrow|(?:(?:mon|tues|wednes|thurs|fri|satur|sun)day))(?:\s*at\s*)?)?(?=(?:.*\b([01]\d|2[0-3])[:.;-]?([0-5]\d)\b)?)(.+)?/i, function(msg, match) {
    winston.info('handler.game - game creation request received');
    var chatId = msg.chat.id;
    var displayName = msg.from.first_name;
    if (msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    if (match[2] && match[3]) {
      var gameTime = new Date();
      gameTime.setHours(match[2]);
      gameTime.setMinutes(match[3]);
      gameTime.setSeconds(0);

      if (match[1]) {
        // could possibly use date.js instead of doing this? http://www.datejs.com/
        var daystr = match[1].toLowerCase();
        if (daystr == 'tomorrow') {
          // change game time to tomorrow
          gameTime.setDate(gameTime.getDate() + 1);
        } else {
          var daynum = daysOfWeek[daystr];
          if (daynum >= 0) {
            // change the day to the next day of week
            gameTime.setDate(gameTime.getDate() + ((7 + daynum - gameTime.getDay()) % 7));
          } // else invalid
        }
        // set the day of the week
        // need to also be able to query just a day of the week to check if dota is scheduled for that day
      }

      // Check if the time is in the past. If it is, then need to add a day
      const now = new Date();
      if (gameTime < now) {
        gameTime.setDate(gameTime.getDate() + 1);
      }
    } else if (match[4]) {
      // no valid time found, and there was other text that we do not currently recognise
      return bot.sendMessage(
        chatId,
        'Unrecognised command. Usage example: `/dota at 1730`',
        { parse_mode: 'Markdown' }
      );
    }

    if (gameTime) {
      // limit the search to the day that the game time is for
      var gameTimeSearchStart = gameTime;
      gameTimeSearchStart.setHours(0);
      gameTimeSearchStart.setMinutes(0);
      gameTimeSearchStart.setSeconds(0);
      var gameTimeSearchEnd = gameTimeSearchStart;
      gameTimeSearchEnd.setDate(gameTimeSearchEnd.getDate() + 1);
    } else {
      // limit the search to the following week
      gameTimeSearchStart = new Date();
      gameTimeSearchEnd = gameTimeSearchStart;
      gameTimeSearchEnd.setDate(gameTimeSearchEnd.getDate() + 8);
      gameTimeSearchEnd.setHours(0);
      gameTimeSearchEnd.setMinutes(0);
      gameTimeSearchEnd.setSeconds(0);
    }

    // Find game
    return Game.findOne({complete: false, gameTime: { '$gte': gameTimeSearchStart, '$lt': gameTimeSearchEnd }})
      .sort({ gameTime: 1 })
      .exec()
      .then((game) => {
        if (game) {
          if (gameTime) {
            // Update the existing game
            winston.info(' Game already exists. Updating');
            game.gameTime = gameTime;
            game.notified = false;
            game.shotgun(displayName);

            winston.info(' saving...');
            return game.save()
              .then((saved) => bot.sendMessage(chatId, 'Dogte time modified'))
              .then((sent) => game.sendTimeUpdate(bot, chatId));
          } else {
            return game.sendTimeUpdate(bot, chatId);
          }
        } else if (gameTime) {
          // Create a new game
          game = new Game({
            gameTime: gameTime,
            chatId: chatId,
            complete: false,
            shotguns: [displayName]
          });
          return game.save()
            .then((sent) => game.sendTimeUpdate(bot, chatId));
        } else {
          bot.sendMessage(chatId, 'No currently scheduled dogte games.');
        }
      }).catch((err) => handleError(err, chatId));
  });

  // *****************************
  //    Delete game
  // *****************************
  bot.onText(/^\/delete_dog?t[ae]s?(?:@\w*)?/i, function(msg) {
    winston.info('handler.game - game deletion request received');
    var chatId = msg.chat.id;

    // Find game
    var a = Game.findOne({complete: false}).exec();
    var b = a.then((game) => {
      if (game) {
        var messageText = 'Are you sure you wish to delete the game at ' + game.gameTime + '? (yes/no)';
        return bot.sendMessage(chatId, messageText, {
          reply_markup: {
            force_reply: true,
            selective: true
          }
        });
      }
      return null;
    });

    return Promise.join(a, b, (game, sent) => {
      if (!sent) {
        return bot.sendMessage(chatId, noGame);
      }
      winston.info(' waiting for message reply');
      return bot.onReplyToMessage(chatId, sent.message_id, (reply) => {
        winston.info(' reply received: ' + reply.text);
        if (/(?:ye*(?:[ps]*)|(?:ah))|(?:sure)|(?:o?k+)/i.exec(reply.text)) {
          return Game.remove({ _id: game._id }).exec().then(() => {
            bot.sendMessage(chatId, 'Dota event deleted');
            winston.info(' dota event deleted!');
          });
        }
      });
    }).catch((err) => handleError(err, chatId));
  });

  // *****************************
  //    shotgun
  // *****************************
  bot.onText(/^\/shotgun(?:@\w*)?/i, function(msg) {
    winston.info('handler.game - shotgun received');
    var chatId = msg.chat.id;
    var displayName = msg.from.first_name;
    if (msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    // Find game
    return Game.findOne({complete: false}).exec()
      .then((game) => {
        if (!game) { return bot.sendMessage(chatId, noGame); }
        game.shotgun(displayName);

        return game.save()
          .then((saved) => game.sendShotgunUpdate(bot, chatId));
      }).catch((err) => handleError(err, chatId));
  });

  // *****************************
  //    unshotgun
  // *****************************
  bot.onText(/^\/unshotgun(?:@\w*)?/i, function(msg) {
    winston.info('handler.game - unshotgun received');
    var chatId = msg.chat.id;
    var displayName = msg.from.first_name;
    if (msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    // Find game
    return Game.findOne({complete: false}).exec()
      .then((game) => {
        if (!game) { return bot.sendMessage(chatId, noGame); }

        game.unshotgun(displayName);
        return game.save()
          .then((saved) => bot.sendMessage(chatId, displayName + ', your shotgun has been cancelled'));
      }).catch((err) => handleError(err, chatId));
  });

  // *****************************
  //    rdy
  // *****************************
  bot.onText(/^\/re?a?dy(?:@\w*)?/i, function(msg) {
    winston.info('handler.game - rdy received');
    var chatId = msg.chat.id;
    var displayName = msg.from.first_name;
    if (msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    // Find game
    return Game.findOne({complete: false}).exec()
      .then((game) => {
        if (!game) { return bot.sendMessage(chatId, noGame); }

        game.readyup(displayName);
        return game.save()
          .then((saved) => game.sendStackUpdate(bot, chatId));
      }).catch((err) => handleError(err, chatId));
  });

  // *****************************
  //    undry
  // *****************************
  bot.onText(/^\/unre?a?dy(?:@\w*)?/i, function(msg) {
    winston.info('handler.game - unrdy received');
    var chatId = msg.chat.id;
    var displayName = msg.from.first_name;
    if (msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    // Find game
    return Game.findOne({complete: false}).exec()
      .then((game) => {
        if (!game) { return bot.sendMessage(chatId, noGame); }

        game.unreadyup(displayName);
        return game.save()
          .then((saved) => bot.sendMessage(chatId, displayName + ', your rdy has been cancelled'));
      }).catch((err) => handleError(err, chatId));
  });

  // *****************************
  // Error handler
  function handleError(err, chatId, msg) {
    winston.error('An error occurred: ', err);
    msg = msg || 'Oh noes! An error occurred';
    return bot.sendMessage(chatId, msg + ': \n' + err);
  }
};
