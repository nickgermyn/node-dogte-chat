/**
 * Service for collecting stats from the user and match DB's
 */

'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var User = require('../models/user');
var Match = require('../models/match');

// *****************************
//  Get statistics for a specified attribute
//  returns a promise
// *****************************
var getStatsForAttribute = function(options) {
  // Get the user
  var whereClause = null;
  if(options.userId) {
    whereClause = { _id: options.userId };
  } else if (options.telegramId) {
    whereClause = { telegramId: options.telegramId };
  } else { throw 'No user specified'; }

  // Check attribute is set
  if(!options.attribute) { throw 'Attribute not specified'; }
  if(['kills', 'deaths', 'assists'].indexOf(options.attribute) === -1) { throw 'Invalid attribute specified'; }
  options.matches = options.matches || 25;

  // **********************************
  // Gets the average of the specified user attribute over
  // the last X number of matches
  var getUserStats = function(user) {
    var theMatches = user.matches
      .filter(m => m.players && m.players.length == 10)
      .slice(0, options.matches)
      .map(m => m.players.find(p => p.accountId == user.steamId));

    var sum = theMatches.reduce((prev,cur) => prev + cur[options.attribute], 0);
    var avg = sum / theMatches.length;
    var max = theMatches.reduce((prev,cur) => cur[options.attribute] > prev ? cur[options.attribute] : prev, 0);
    var min = theMatches.reduce((prev,cur) => cur[options.attribute] < prev ? cur[options.attribute] : prev, 999);
    return {
      user: {
        userId: user._id,
        steamId: user.steamId,
        userName: user.userName,
        displayName: user.displayName,
        telegramId: user.telegramId
      },
      attribute: options.attribute,
      sum: sum,
      average: avg,
      max: max,
      min: min,
      matches: theMatches.length
    };
  }

  return User.findOne(whereClause)
    .populate({ "path": "matches", "options" : { "skip": 0, "limit": 25 } })
    .exec()
    .then(user => getUserStats(user));
};

// *****************************
//  Formats the response of the getStats method
//  returns a string
// *****************************
var format = function(result) {
  return result.attribute + ' in last ' + result.matches + ' matches\n Total: ' + result.sum + '\n Min: ' + result.min + '\n Max: ' + result.max + '\n Average: ' + result.average;
};

module.exports = {
  getStatsForAttribute: getStatsForAttribute,
  format: format
}
