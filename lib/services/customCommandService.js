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

module.exports = {
	registerHandler,
	getHandlers
};
