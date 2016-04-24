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
  bot.onText(/\/register (.+)/, function(msg, match) {
    winston.info('handler.account - register command received');
    var chatId = msg.chat.id;
    var telegramId = msg.from.id;
    var userName = msg.from.username;
    var displayName = msg.from.first_name;
    if(msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    var parts = match[1];
    winston.debug('parts: ' + parts);
    winston.debug('from: ', msg.from);

    var steamIdStr = getParam(parts, 'steam');
    var dotaBuffId = getParam(parts, 'dotabuff');

    // Take the bottom 32bits of the steamId
    if(steamIdStr) {
      winston.debug('steamid: ' + steamIdStr);
      var steamIdLong = Long.fromString(steamIdStr);
      var steamId = steamIdLong.low;
      winston.debug('lowInt: ' + steamId);
    }
    // Find game
    return User.findOne({telegramId: telegramId}).exec()
      .then(user => {
        if(user) {
          // Update the existing user
          if(steamId) {
            user.steamId = steamId;
          }
          if(dotaBuffId) {
            user.dotaBuffId = dotaBuffId;
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
            dotaBuffId: dotaBuffId
          });

          return user.save()
            .then(saved => bot.sendMessage(chatId, 'Account created!'));
        }
    }).catch(err => handleError(err, chatId, 'There was an error creating account'));
  });

  // *****************************
  //    Get account
  // *****************************
  bot.onText(/\/account/, function(msg) {
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

  // *****************************
  //  getParam(text, param)
  //
  // Helper to extract a parameter value from a String
  // e.g. for source string 'steam:123 dotabuff:456'
  // if called for param 'steam' the method would
  // return 123. If not found, null is returned.
  function getParam(text, param) {
    var params = text.split(' ');
    var theParam = params.find(function(p) {
      return p.startsWith(param);
    });

    if(!theParam) { return null; }
    var nameAndVal = theParam.split(':');

    if(nameAndVal.length != 2) { return null; }
    return nameAndVal[1];
  }
}
