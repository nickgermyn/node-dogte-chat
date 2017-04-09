/**
 * Dota game organisation handlers
 */

'use strict';

var winston = require('winston');

module.exports = function(bot) {

	// *****************************
	// Error handler
	function handleError(err, chatId, msg) {
		winston.error('An error occurred: ', err);
		msg = msg || 'Oh noes! An error occurred';
		return bot.sendMessage(chatId, msg + ': \n' + err);
	}
};
