/**
 * Service for sending photos via telegram bot
 */

'use strict';

var Photo = require('../models/photos');
var path = require('path');
var winston = require('winston');

var sendPhoto = function(bot, chatId, name, relativePath) {
	return Photo.findOne({name}).exec()
		.then(storedPhoto => {
			if (storedPhoto) {
				return bot.sendPhoto(chatId, storedPhoto.fileId);
			} else {
				relativePath = relativePath || '../resources/' + name;
				var photoPath = path.join(__dirname, relativePath);
				winston.debug('Photo not found in db. Sending file from path:', photoPath);
				return bot.sendPhoto(chatId, photoPath).then(resp => {
					storedPhoto = new Photo({
						name: name,
						fileId: resp.photo[0].file_id
					});
					return storedPhoto.save();
				});
			}
		});
};

module.exports = {
	sendPhoto
};
