/**
 * User account handlers
 */

'use strict';

var User = require('../models/user');
var Long = require('long');
var winston = require('winston');

module.exports = function(bot) {

  // *****************************
  //    Register account
  // *****************************
  bot.onText(/^\/register(?:@\w*)?\b(?=(?:.*\bsteam:(\d+)\b)?)(?=(?:.*\bdotabuff:(\d*)\b)?)/i, function(msg, match) {
    winston.info('handler.account - register command received');
    var chatId = msg.chat.id;
    var telegramId = msg.from.id;
    var userName = msg.from.username;
    var displayName = msg.from.first_name;
    if(msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    winston.debug('from: ', msg.from);

    var steamId = match[1];
    var dotabuffId = match[2];

    // steam to 32bit
    // 4503599627370496 minimum steam64 length (16)
    // 4294967295 maximum steam32 length (10)
    if (steamId && steamId.length > 10) {
      winston.debug('steamid: ' + steamId);
      steamId = Long.fromString(steamId).low;
      winston.debug('lowInt: ' + steamId);
    }

    // Find user
    return User.findOne({telegramId: telegramId}).exec()
      .then(user => {
        if(user) {
          // Update the existing user
          if(steamId) {
            user.steamId = steamId;
          }
          if(dotabuffId) {
            user.dotaBuffId = dotabuffId;
          }

          user.userName = userName;
          user.displayName = displayName;

          return user.save()
            .then(saved => bot.sendMessage(chatId, 'Account updated!'));
        } else {
          // Create a new user
          user = new User({
            telegramId: telegramId,
            userName: userName,
            displayName: displayName,
            steamId: steamId,
            dotaBuffId: dotabuffId
          });

          return user.save()
            .then(saved => bot.sendMessage(chatId, 'Account created!'));
        }
    }).catch(err => handleError(err, chatId, 'There was an error creating account'));
  });

  // *****************************
  //    Get account
  // *****************************
  bot.onText(/^\/account(?:@\w*)?/i, function(msg) {
    winston.info('handler.account - account query received');
    var chatId = msg.chat.id;
    var telegramId = msg.from.id;
    var userName = msg.from.userName;

    // Find account
    User.findOne({telegramId: telegramId}).exec()
      .then(user => {
        if(!user) { bot.sendMessage(chatId, 'Could not find account. Have you registered?'); }
        return bot.sendMessage(chatId, JSON.stringify(user));
      }).catch(err => handleError(err, chatId));
  });

  // *****************************
  // Error handler
  function handleError(err, chatId, msg) {
    winston.error('An error occurred: ',err);
    msg = msg || 'Oh noes! An error occurred';
    return bot.sendMessage(chatId, msg+': \n'+err);
  }
}
