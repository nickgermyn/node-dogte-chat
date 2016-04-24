/**
 * Service for collecting stats from the user and match DB's
 */

'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var Match = require('../models/match');

var validAttributes = ['kills', 'deaths', 'assists'];
// *****************************
//  Get statistics for a specified attribute
//  returns a promise
// *****************************
var getStatsForAttribute = function(options) {

  // Check the appropriate options are set
  if(!options.steamId) { throw 'No account specified'; }
  if(!options.attribute) { throw 'Attribute not specified'; }
  if(validAttributes.indexOf(options.attribute) === -1) { throw 'Invalid attribute specified'; }
  options.matches = options.matches || 25;

  // **********************************
  // Gets the average of the specified user attribute over
  // the last X number of matches
  var aggregate = function(matches) {
    var sum = 0;
    var max = 0;
    var max_match = null;
    var min = 999;
    var min_match = null;

    for (var i = 0; i < matches.length; i++) {
      var match = matches[i];
      var attrVal = match.players[options.attribute];
      var matchId = match.match_id;

      sum += attrVal;
      if(attrVal > max) {
        max = attrVal;
        max_match = matchId;
      }
      if(attrVal < min) {
        min = attrVal;
        min_match = matchId;
      }
    }

    var avg = sum / matches.length;

    return {
      attribute: options.attribute,
      sum: sum,
      average: avg,
      max: max,
      maxMatch: max_match,
      min: min,
      minMatch: min_match,
      matches: matches.length
    };
  }

  return Match.aggregate()
    .unwind('players')
    .match({ 'players.accountId' : parseInt(options.steamId) })
    .sort({ 'startTime': -1 })
    .limit(options.matches)
    .exec()
    .then(matches => aggregate(matches));
  // return Match.find({ players: { $elemMatch: { accountId: options.steamId } } })
  //   .limit(options.matches)
  //   .exec()
  //   .then(matches => aggregate(matches));
};

// *****************************
//  Formats the response of the getStats method
//  returns a string
// *****************************
var format = function(result) {
  return result.attribute + ' in last ' + result.matches + ' matches\n Total: ' + result.sum + '\n Min: ' + result.min + '\n Max: ' + result.max + '\n Average: ' + result.average;
};
// *****************************
//  Formats the response of the getStats method on a single line
//  returns a string
// *****************************
var formatSingleLine = function(result) {
  return '*' + result.attribute + '*: Total: '+ result.sum + ' Min: ' + result.min + ' Max: ' + result.max + ' Avg: ' + result.average;
};

module.exports = {
  getStatsForAttribute: getStatsForAttribute,
  validAttributes: validAttributes,
  format: format,
  formatSingleLine: formatSingleLine
}
