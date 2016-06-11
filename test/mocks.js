'use strict';

var Promise = require('bluebird');

/* Mock of the TelegramBot */
class BotMock {
	constructor() {
		this.registeredCallbacks = [];
		this.sentMessages = [];
	}

	onText(regexp, callback) {
		this.registeredCallbacks.push({ regexp, callback });
	}

	simulateMessage(message) {
		const promises = [];
		this.registeredCallbacks.forEach(reg => {
			const result = reg.regexp.exec(message.text);
			if (result) {
				promises.push(reg.callback(message, result));
			}
		});
		return Promise.all(promises);
	}

	sendMessage(chatId, message, options) {
		var self = this;
		return new Promise((resolve, reject) => {
			self.sentMessages.push({
				chatId: chatId,
				message: message,
				options: options
			});
			resolve();
		});
	}
}

module.exports = {
	Bot: BotMock
};
