/**
 * Dota game organisation handlers
 */

'use strict';

// var Photo = require('../models/photos');
// var path = require('path');
var winston = require('winston');
var photoService = require('../services/photoService');

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
    return photoService.sendPhoto(bot, chatId, 'noice.jpg')
      .catch(err => handleError(err, chatId, 'Error sending photo'));
  });

  // *****************************
  //    Shiteater picture
  // *****************************
  bot.onText(/^\/(shiteater|holier-than-thou)(?:@\w*)?/i, function(msg) {
    var chatId = msg.chat.id;
    return photoService.sendPhoto(bot, chatId, 'shiteater.jpg')
      .catch(err => handleError(err, chatId, 'Error sending photo'));
  });

  // *****************************
  //    Pedant
  // *****************************
  bot.onText(/^\/pedant(?:@\w*)?/i, function(msg) {
    var chatId = msg.chat.id;
    const file_id = 'AgADAwADaqoxG2lVOQJDXTrmXlQOeiLmhjEABEVxg8BFw5RIyCsAAgI';
    return bot.sendPhoto(chatId, file_id);
  });

  // *****************************
  // Error handler
  function handleError(err, chatId, msg) {
    winston.error('An error occurred: ', err);
    msg = msg || 'Oh noes! An error occurred';
    return bot.sendMessage(chatId, msg + ': \n' + err);
  }
};
