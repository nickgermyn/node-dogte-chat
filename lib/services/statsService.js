/**
 * Service for collecting stats from the user and match DB's
 */

'use strict';

var Match = require('../models/match');
var moment = require('moment');
require('moment-duration-format');

var validAttributes = ['kills', 'deaths', 'assists'];
// *****************************
//  Get statistics for a specified attribute
//  returns a promise
// *****************************
var getStatsForAttribute = function(options) {

  // Check the appropriate options are set
  if (!options.steamId) { throw 'No account specified'; }
  if (!options.attribute) { throw 'Attribute not specified'; }
  if (validAttributes.indexOf(options.attribute) === -1) { throw 'Invalid attribute specified'; }
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
      if (attrVal > max) {
        max = attrVal;
        max_match = matchId;
      }
      if (attrVal < min) {
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
  };

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
  return result.attribute + ' in last ' + result.matches + ' matches\n' +
    'Total: ' + result.sum + '\n' +
    'Min: ' + result.min + '\n' +
    'Max: ' + result.max + '\n' +
    'Average: ' + result.average;
};
// *****************************
//  Formats the response of the getStats method on a single line
//  returns a string
// *****************************
var formatSingleLine = function(result) {
  return '*' + result.attribute + '*: ' +
    'Total: ' + result.sum +
    ' Min: ' + result.min +
    ' Max: ' + result.max +
    ' Avg: ' + result.average;
};

// *****************************
//  Gets the last x matches for the specified player, allowing custom aggregation
//  returns a promise
// *****************************
var getMatchesAggregate = function(options) {

  // Check the appropriate options are set
  if (!options.steamId) { throw 'No account specified'; }
  options.matches = options.matches || 25;

  return Match.aggregate()
    .unwind('players')
    .match({ 'players.accountId' : parseInt(options.steamId) })
    .sort({ 'startTime': -1 })
    .limit(options.matches)
    .exec();
};

// *****************************
//  Summarises a players stats for the last X matches
//  returns a promise
// *****************************
var getStatSummary = function(options) {
  var aggregate = matches => {
    // Stats collected:
    // - highest KDA ratio
    // - highest kills
    // - highest hero damage
    // - longest game
    // - average KDA ratio

    let matchCounter = 0;
    let kdaSum = 0;

    const lblTopKda = 'Top KDA';
    const lblTopK = 'Top Kills';
    const lblTopHd = 'Top Hero Damage';
    const lblLongDur = 'Longest Duration';
    const lblAvgKda = 'Average KDA';

    const topStats = {};
    topStats[lblTopKda] = { value: 0, match: null };
    topStats[lblTopK] = { value: 0, match: null };
    topStats[lblTopHd] = { value: 0, match: null };
    topStats[lblLongDur] = { value: 0, match: null };

    matches.forEach(m => {
      const matchId = m.matchId;
      const kills = m.players.kills;
      const deaths = m.players.deaths;
      const assists = m.players.assists;
      const kda = (kills + assists) / deaths;

      if (kda > topStats[lblTopKda].value) {
        topStats[lblTopKda].value = kda;
        topStats[lblTopKda].displayValue = kda.toFixed(2);
        topStats[lblTopKda].match = matchId;
      }
      if (kills > topStats[lblTopK].value) {
        topStats[lblTopK].value = kills;
        topStats[lblTopK].displayValue = kills;
        topStats[lblTopK].match = matchId;
      }
      if (m.players.heroDamage > topStats[lblTopHd].value) {
        topStats[lblTopHd].value = m.players.heroDamage;
        topStats[lblTopHd].displayValue = (m.players.heroDamage / 1000).toFixed(2) + 'k';
        topStats[lblTopHd].match = matchId;
      }
      if (m.duration > topStats[lblLongDur].value) {
        topStats[lblLongDur].value = m.duration;
        topStats[lblLongDur].displayValue = moment.duration(m.duration, 'seconds').format();
        topStats[lblLongDur].match = matchId;
      }
      kdaSum += kda;
      ++matchCounter;
    });

    topStats[lblAvgKda] = {
      value: kdaSum / matchCounter,
      displayValue: (kdaSum / matchCounter).toFixed(2)
    };

    return topStats;
  };

  return getMatchesAggregate(options)
    .then(matches => aggregate(matches));
};

module.exports = {
  getStatsForAttribute: getStatsForAttribute,
  validAttributes: validAttributes,
  format: format,
  formatSingleLine: formatSingleLine,
  getMatchesAggregate: getMatchesAggregate,
  getStatSummary: getStatSummary
};
