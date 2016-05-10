/**
 * Dota game organisation handlers
 */

'use strict';

//var Game = require('../models/game');
//var path = require('path');
var winston = require('winston');

module.exports = function(bot) {

  // *****************************
  // gAM!
  // *****************************
  bot.onText(/^\/game?!?(?:@\w*)?/i, function(msg) {
    var chatId = msg.chat.id;
    return bot.sendMessage(chatId, '@Chicken_Lips GAM!');
  });

  // *****************************
  //    Percent man picture
  // *****************************
  bot.onText(/^\/percentman(?:@\w*)?/i, function(msg) {
    var chatId = msg.chat.id;
    //var photo = path.join(__dirname, '../resources/percentman.jpg');
    //winston.info(photo);

    // Updated to use file id instead
    const file_id = 'AgADBQADqqcxGyhaOAvdebg3tenAnnOyvzIABFUjwhiwDPp9UTQAAgI';
    return bot.sendPhoto(chatId, file_id);
  });

  // *****************************
  //    Noice picture
  // *****************************
  bot.onText(/^\/noice(?:@\w*)?/i, function(msg) {
    var chatId = msg.chat.id;
    const file_id = 'TBA';//'AgADBQADqqcxGyhaOAvdebg3tenAnnOyvzIABFUjwhiwDPp9UTQAAgI';
    return bot.sendPhoto(chatId, file_id);
  });
};
