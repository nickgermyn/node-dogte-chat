'use strict';

var mongoose = require('mongoose');
var customCommandService = require('../services/customCommandService');

var Schema = mongoose.Schema;

var commandSchema = new Schema({
	name: String,
	method: String,
	createdBy: String,
	createdDate: Date,
	updatedBy: String,
	updatedDate: Date
});

	// *****************************
	// Executes the given commands method
	// - looks up a list of known handlers in the
	// customCommandService
commandSchema.methods.execute = function(bot, msg) {
	const promises = [];
	customCommandService.getHandlers().forEach(handler => {
		const result = handler.regexp.exec(this.method);
		if (result) {
			promises.push(handler.callback(msg, result, bot));
		}
	});
	return Promise.all(promises);
};

module.exports = mongoose.model('Command', commandSchema);
