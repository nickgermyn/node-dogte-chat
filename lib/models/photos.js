'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var photoSchema = new Schema({
  name: String,
  fileId: String
});

module.exports = mongoose.model('Photo', photoSchema);
