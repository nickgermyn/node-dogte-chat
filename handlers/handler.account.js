/**
 * User account handlers
 */

'use strict';

var User = require('../models/user');

module.exports = function(bot) {

  // *****************************
  //    Register account
  // *****************************
  bot.onText(/\/register (.+)/, function(msg, match) {
    var chatId = msg.chat.id;
    var telegramId = msg.from.id;
    var userName = msg.from.username;
    var displayName = msg.from.first_name;
    if(msg.from.last_name) {
      displayName += ' ' + msg.from.last_name;
    }

    var parts = match[1];
    console.log('parts: ' + parts);
    console.log('from: ', msg.from);

    var steamId = getParam(parts, 'steam');
    var dotaBuffId = getParam(parts, 'dotabuff');

    try {
      // Find game
      User.findOne({telegramId: telegramId}, function(err, user) {
        if(err) return handleError(err, chatId);
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

          user.save(function(err) {
            if(err) return handleError(err, chatId);

            // Send message indicating so
            bot.sendMessage(chatId, 'Account updated!');
          });

        } else {
          // Create a new user
          User.create({
            telegramId: telegramId,
            userName: userName,
            displayName: displayName,
            steamId: steamId,
            dotaBuffId: dotaBuffId
          }, function(err, createdItem) {
            if(err) return handleError(err, chatId);

            // Send message about game creation
            bot.sendMessage(chatId, 'Account created!');
          });
        }
      });
    } catch (e) {
      bot.sendMessage(chatId, 'There was an error creating account');
      console.error(e)
    }
  });

  // *****************************
  //    Get account
  // *****************************
  bot.onText(/\/account/, function(msg) {
    var chatId = msg.chat.id;
    var telegramId = msg.from.id;
    var userName = msg.from.userName;

    // Find account
    User.findOne({telegramId: telegramId}, function(err, user) {
      if(err) return handleError(err, chatId);
      if(user) {
        bot.sendMessage(chatId, JSON.stringify(user));
      } else {
        bot.sendMessage(chatId, 'Could not find account. Have you registered?');
      }
    });
  });


  // *****************************
  // Error handler
  function handleError(err, chatId) {
    console.error(err);
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
