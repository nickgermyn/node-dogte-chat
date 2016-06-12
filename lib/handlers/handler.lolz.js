/**
 * Dota game organisation handlers
 */

'use strict';

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
	// Error handler
	function handleError(err, chatId, msg) {
		winston.error('An error occurred: ', err);
		msg = msg || 'Oh noes! An error occurred';
		return bot.sendMessage(chatId, msg + ': \n' + err);
	}
};
