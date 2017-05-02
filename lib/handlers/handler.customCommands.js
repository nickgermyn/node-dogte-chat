/**
 * Custom command handlers that are registered from chat
 */

'use strict';

//var Promise = require('bluebird');
var Command = require('../models/command');
var winston = require('winston');

module.exports = function(bot) {

	// *****************************
	//		Command registration
	// *****************************
	bot.onText(/^\/setcommand\b\s(\/\w*)\b\s(\S*)/i, function(msg, match) {
		winston.info('handler.customCommands - setcommand instruction received');
		var chatId = msg.chat.id;
		var displayName = msg.from.first_name + msg.from.last_name ? ' ' + msg.from.last_name : '';
		var commandName = match[1].toLowerCase();
		var method = match[2];
		winston.debug('command: ' + commandName + ', method: ' + method);

		// Find command
		return Command.findOne({name: commandName, chatId: chatId}).exec()
			.then(cmd => {
				if (cmd) {
					// Existing command - update
					cmd.method = method;
					cmd.updatedBy = displayName;
					cmd.udpatedDate = new Date();

					return cmd.save()
						.then(saved => bot.sendMessage(chatId, 'Command updated!'));
				} else {
					// New command - insert
					cmd = new Command({
						name: commandName,
						method: method,
						createdBy: displayName,
						createdDate: new Date(),
						updatedBy: displayName,
						updatedDate: new Date()
					});
					return cmd.save()
						.then(saved => bot.sendMessage(chatId, 'Command registered!'));
				}
			}).catch(err => handleError(err, chatId, 'There was an error registering command'));
	});

	// *****************************
	//		Command deletion
	// *****************************
	bot.onText(/^\/deletecommand\b\s(\/\w*)/i, function(msg, match) {
		winston.info('handler.customCommands - deletecommand instruction received');
		var chatId = msg.chat.id;
		var commandName = match[1].toLowerCase();
		winston.debug('command: ' + commandName + ' to be deleted');

		// Find command
		return Command.findOne({name: commandName, chatId: chatId}).exec()
			.then(cmd => {
				if (cmd) {
					return Command.remove({ _id: cmd._id }).exec().then(() => {
						winston.info('command deleted');
						return bot.sendMessage(chatId, 'Command deleted!');
					});
				} else {
					// Command doesn't exist
					return bot.sendMessage(chatId, 'Specified command ' + commandName + ' could not be found!');
				}
			}).catch(err => handleError(err, chatId, 'There was an error deleting command'));
	});

	// *****************************
	//		Command listing
	// *****************************
	bot.onText(/^\/listcommands\b/i, function(msg, match) {
		winston.info('handler.customCommands - listcommand instruction received');
		var chatId = msg.chat.id;

		// Find command
		return Command.find({chatId: chatId}).exec()
			.then(cmds => {
				if (cmds.length === 0) {
					return bot.sendMessage(chatId, 'There are no commands registered');
				}
				var message = 'The following commands are registered:\n\n';
				message += cmds.reduce((prev, cur) => prev + '`' + cur.name + '` - `' + cur.method + '`\n', '');
				winston.debug(message);
				return bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
			}).catch(err => handleError(err, chatId, 'There was an error listing command'));
	});

	// *****************************
	//		Global command hanlder
	// *****************************
	bot.onText(/^\/\w*\b/i, function(msg, match) {
		var cmdLower = match[0].toLowerCase();
		var chatId = msg.chat.id;
		// Find matching command
		return Command.findOne({name: cmdLower, chatId: chatId}).exec()
			.then(cmd => {
				if (cmd) {
					winston.debug('executing command: ' + cmd.name);
					// Found a matching command - execute it
					cmd.execute(bot, msg);
				}
			}).catch(err => winston.error('An error occurred: ', err));
	});

	// *****************************
	// Error handler
	function handleError(err, chatId, msg) {
		winston.error('An error occurred: ', err);
		msg = msg || 'Oh noes! An error occurred';
		return bot.sendMessage(chatId, msg + ': \n' + err);
	}

};
