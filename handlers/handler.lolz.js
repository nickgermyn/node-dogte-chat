/**
 * Dota game organisation handlers
 */

'use strict';

var Game = require('../models/game');
var path = require('path');
var winston = require('winston');

const noGame = 'No game scheduled today';

module.exports = function(bot) {

  // *****************************
  // gAM!
  // *****************************
  bot.onText(/GAM!/, function(msg) {
    var chatId = msg.chat.id;
    return bot.sendMessage(chatId, '@Chicken_Lips GAM!');
  });

  // *****************************
  //    Percent man picture
  // *****************************
  bot.onText(/\/percentman/, function(msg) {
    var chatId = msg.chat.id;
    //var photo = path.join(__dirname, '../resources/percentman.jpg');
    //winston.info(photo);

    // Updated to use file id instead
    const file_id = 'AgADBQADqqcxGyhaOAvdebg3tenAnnOyvzIABFUjwhiwDPp9UTQAAgI';
    return bot.sendPhoto(chatId, file_id);
  });

  // *****************************
  // Error handler
  function handleError(err, chatId, msg) {
    winston.error('An error occurred: ',err);
    msg = msg || 'Oh noes! An error occurred';
    return bot.sendMessage(chatId, msg+': \n'+err);
  }
}
