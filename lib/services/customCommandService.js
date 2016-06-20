/**
 * Service for registering custom command methods
 */

'use strict';

var winston = require('winston');
var commandHandlers = [];

var registerHandler = function(regexp, callback) {
	commandHandlers.push({regexp, callback});
};

var getHandlers = function() {
	return commandHandlers;
};


// *****************************
// Register the default handlers
// *****************************

// Send Photo
registerHandler(/^sendPhoto\('([a-zA-Z0-9\-_]*)'\)/i, (msg, match, bot) => {
	winston.info('sendPhoto(' + match[1] + ')');
	return bot.sendPhoto(msg.chat.id, match[1]);
});

// Send Document
registerHandler(/^sendDocument\('([a-zA-Z0-9\-_]*)'\)/i, (msg, match, bot) => {
	winston.info('sendDocument(' + match[1] + ')');
	return bot.sendDocument(msg.chat.id, match[1]);
});

// Send Sticker
registerHandler(/^sendSticker\('([a-zA-Z0-9\-_]*)'\)/i, (msg, match, bot) => {
	winston.info('sendSticker(' + match[1] + ')');
	return bot.sendSticker(msg.chat.id, match[1]);
});

// Send Video
registerHandler(/^sendVideo\('([a-zA-Z0-9\-_]*)'\)/i, (msg, match, bot) => {
	winston.info('sendVideo(' + match[1] + ')');
	return bot.sendVideo(msg.chat.id, match[1]);
});

// Send Voice
registerHandler(/^sendVoice\('([a-zA-Z0-9\-_]*)'\)/i, (msg, match, bot) => {
	winston.info('sendVoice(' + match[1] + ')');
	return bot.sendVoice(msg.chat.id, match[1]);
});

module.exports = {
	registerHandler,
	getHandlers
};
