/**
 * Help / utility related handlers
 */

'use strict';

var child_process = require('child_process');
var readMe = require('../resources/ReadMeMessage.md');
var pkg = require('../../package.json');
var config = require('../config/environment');

module.exports = function(bot) {
	// My Id
	bot.onText(/^\/myid(?:@\w*)?\b/i, function(msg) {
		var chatId = msg.chat.id;
		return bot.sendMessage(chatId, msg.from.id);
	});

	// Echo
	bot.onText(/^\/echo(?:@\w*)?\b\s*(.+)/i, function(msg, match) {
		var chatId = msg.chat.id;
		var resp = match[1];
		return bot.sendMessage(chatId, resp);
	});

	// Help
	bot.onText(/^\/help(?:@\w*)?/i, function(msg) {
		var chatId = msg.chat.id;
		var resp = readMe;
		return bot.sendMessage(chatId, resp, { parse_mode: 'Markdown'});
	});

	// Version
	bot.onText(/^\/version(?:@\w*)?/i, function(msg) {
		var chatId = msg.chat.id;
		var resp = '`' + pkg.version + '`';
		return bot.sendMessage(chatId, resp, { parse_mode: 'Markdown'});
	});

	// Update
	bot.onText(/^\/update(?:@\w*)?/i, function(msg) {
		var chatId = msg.chat.id;

		// Check if update script is configured
		if (!config.updateScript) {
			return bot.sendMessage(chatId, 'Cannot update. No update script configured!');
		}

		return bot.sendMessage(chatId, 'Updating. Please wait...').then(resp => {
			child_process.execFile(config.updateScript, (error, stdout, stderr) => {
				if (error) {
					return bot.sendMessage(chatId, 'An error occurred: ' + error);
				}
				return bot.sendMessage(chatId, 'Update complete!\n' + stdout);
			});
		});
	});

	bot.on('audio', function(msg) {
		return bot.sendMessage(msg.chat.id, 'audio file_id: ' + msg.audio.file_id);
	});

	bot.on('document', function(msg) {
		return bot.sendMessage(msg.chat.id, 'document file_id: ' + msg.document.file_id);
	});

	bot.on('photo', function(msg) {
		return bot.sendMessage(msg.chat.id, 'photo file_id: ' + msg.photo[0].file_id);
	});

	bot.on('sticker', function(msg) {
		return bot.sendMessage(msg.chat.id, 'sticker file_id: ' + msg.sticker.file_id);
	});

	bot.on('video', function(msg) {
		return bot.sendMessage(msg.chat.id, 'video file_id: ' + msg.video.file_id);
	});

	bot.on('voice', function(msg) {
		return bot.sendMessage(msg.chat.id, 'voice file_id: ' + msg.voice.file_id);
	});
};
