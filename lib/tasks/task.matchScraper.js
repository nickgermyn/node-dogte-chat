/**
 * Dota match scrapign service
 */

'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var schedule = require('node-schedule');
var User = require('../models/user');
var Match = require('../models/match');
var config = require('../config/environment');
var da = Promise.promisifyAll(require('dota2-api').create(config.steam.apiKey));

module.exports = {

  schedule: function(bot) {
    // Run funciton every 15 minutes on the minute
    var rule = new schedule.RecurrenceRule();
    rule.minute = [0, 15, 30, 45];
    schedule.scheduleJob(rule, this.checkRecentlyPlayed);
  },

  rebuild: function() {
    console.log('>>rebuilding...');

    return Match.remove({}).exec()
      .then(res => console.log('cleared old data'))
      .then(() => this.checkRecentlyPlayed(100))
      .then(() => console.log('Finished rebuilding!'))
      .catch(err => console.error('an error occurred', err));
  },

  // *****************************
  //  Checks for recently played matches which have not been
  //  stored locally and downloads them
  // *****************************
  checkRecentlyPlayed: function(matchesRequested) {
    console.log('>>checkRecentlyPlayed...');
    matchesRequested = matchesRequested || 25;

    var getRecentGames = function(user) {
      console.log('getting match history for account ' + user.steamId);
      var accountId = user.steamId;
      return da.getMatchHistoryAsync({account_id: accountId, matches_requested: matchesRequested})
        .then(result => JSON.parse(result).result.matches || [])
        .filter(mh => mh.players && mh.players.length == 10);
    };

    var checkExisting = function(matches) {
      var listOfMatches = [].concat.apply([], matches);
      var uniqueMatches = _.uniqBy(listOfMatches, m => m.match_id);
      return Promise.filter(uniqueMatches, m => {
        console.log('Checking if match ' + m.match_id + ' exist');
        return Match.findOne({matchId: m.match_id}).exec()
          .then(foundMatch => {
            if (foundMatch) {
              console.log(' match ' + m.match_id + ' already stored.');
              return false;
            } else {
              console.log(' match ' + m.match_id + ' not found.');
              return true;
            }
          })
          .catch(err => {
            console.error('error finding match. Filtering out');
            return false;
          });
      });
    };

    var getMatchDetails = function(match) {
      console.log('Getting details for match ' + match.match_id);
      return da.getMatchDetailsAsync({match_id: match.match_id})
        .then(result => JSON.parse(result).result);
    };

    var saveMatch = function(m) {
      if (!m) {
        console.log(' cannot map to Match document - not defined');
        return;
      }
      var match = new Match({
        matchId: m.match_id,
        startTime: new Date(m.start_time * 1000),
        duration: m.duration,
        gameMode: m.game_mode,
        players: (m.players || []).map(p => {
          return {
            accountId: p.account_id,
            playerSlot: p.player_slot,
            heroId: p.hero_id,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists
          };
        }),
        result: {
          radiantWin: m.radiant_win,
          towerStatusRadiant: m.tower_status_radiant,
          towerStatusDire: m.tower_status_dire,
          barracksStatusRadiant: m.barracks_status_radiant,
          barracksStatusDire: m.barracks_status_dire,
          cluster: m.cluster,
          firstBloodTime: m.first_blood_time,
          radiantScore: m.radiant_score,
          direScore: m.dire_score
        }
      });

      console.log('Saving match ' + match.matchId);
      return match.save();
    };

    return User.find({ steamId: { $ne: null }}).exec()
    .then(users => Promise.all(users.map(getRecentGames)))
    .then(matches => checkExisting(matches))
    .then(matches => Promise.map(matches, m => getMatchDetails(m).then(md => saveMatch(md)), { concurrency: 5 }));
  }
};
