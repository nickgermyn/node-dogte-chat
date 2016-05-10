/**
 * Dota game organisation handlers
 */

'use strict';

var Photo = require('../models/photos');
var path = require('path');
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
    return Photo.findOne({name: 'noice.jpg'}).exec()
      .then((storedPhoto) => {
        if (storedPhoto) {
          return bot.sendPhoto(chatId, storedPhoto.fileId);
        } else {
          var photoPath = path.join(__dirname, '../resources/noice.jpg');
          console.log(photoPath);
          return bot.sendPhoto(chatId, photoPath).then((resp) => {
            storedPhoto = new Photo({
              name: 'noice.jpg',
              fileId: resp.photo[0].file_id
            });
            return storedPhoto.save();
          });
        }
      })
    .catch((err) => handleError(err, chatId, 'Error sending photo'));
  });

  // *****************************
  // Error handler
  function handleError(err, chatId, msg) {
    winston.error('An error occurred: ', err);
    msg = msg || 'Oh noes! An error occurred';
    return bot.sendMessage(chatId, msg + ': \n' + err);
  }
};
