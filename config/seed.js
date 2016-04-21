/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../models/user');

// User.find({}).remove(function() {
//   User.create({
//     username  : 'Nick Germyn',
//     telegramId: 'telegram',
//     steamId: 'steam'
//   });
// });
