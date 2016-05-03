'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  telegramId: String,
  userName: String,
  displayName: String,
  steamId: String,
  dotaBuffId: String
});

module.exports = mongoose.model('User', userSchema);
