/**
 * User account handlers
 */

'use strict';

var Promise = require('bluebird');
var steam = require('steam-web');
var User = require('../models/user');
var config = require('../config/environment');
var da = Promise.promisifyAll(require('dota2-api').create(config.steam.apiKey));
var fs = Promise.promisifyAll(require('fs'));

module.exports = function(bot) {

  const outputFileName = './data/feeds.json';

  var appId = config.steam.dota.appId
  var s = new steam({
    apiKey: config.steam.apiKey,
    format: 'json'
  });

  // *****************************
  //    Dota news
  // *****************************
  bot.onText(/\/news/, function(msg) {
    var chatId = msg.chat.id;

    s.getNewsForApp({
      appid: appId,
      count: 1,
      maxlength: 300,
      callback: function(err, data) {
        if(err) {
          bot.sendMessage(chatId, 'Request failed. Servers may be down');
          return handleError(err);
        }
        var latestNews = data.appnews.newsitems[0];
        console.log(latestNews);

        var header = '*Latest Dota 2 news post * ('+latestNews.feedlabel+')';
        try {
            bot.sendMessage(chatId, newsReply(header, latestNews));
        } catch (e) {
          console.error('Couldn\'t parse: ' + latestNews);
        }
      }
    });
  });

  // *****************************
  //    Matches
  // *****************************
  bot.onText(/\/matches/, function(msg) {
    var chatId = msg.chat.id;
    var telegramId = msg.from.id;
    var userName = msg.from.userName;

    // Find account
    User.findOne({telegramId: telegramId}, function(err, user) {
      if(err) return handleError(err, chatId);
      if(user) {
        console.log('found user '+user.steamId+' getting match history..');
        da.getMatchHistoryAsync({account_id: user.steamId, matches_requested: 5})
        .then(function(result) {
          var matches = JSON.parse(result).result.matches;
          if(matches) {
            //TODO: send list of matches back
          }
        })
        .catch(function(err) {
          handleError(err, chatId);
        });
      } else {
        bot.sendMessage(chatId, 'Could not find account. Have you registered?');
      }
    });
  });

  // *****************************
  //    Last Match
  // *****************************
  bot.onText(/\/lastmatch/, function(msg) {
    var chatId = msg.chat.id;
    var telegramId = msg.from.id;
    var userName = msg.from.userName;

    // Find account
    User.findOne({telegramId: telegramId}).exec()
      .then(function(user) {
        if(user) {
          console.log('found user '+user.steamId+' getting match history..');

          return da.getMatchHistoryAsync({account_id: user.steamId, matches_requested: 1})
            .then(function(result) {
              console.log('returned result: ', result);
              var matches = JSON.parse(result).result.matches;
              if(matches) {
                console.log('Found matches. Building response...');
                return sendMatch(chatId, matches[0].match_id);
              }
              console.log('no matches found');
            })
            .catch(function(err) {
              handleError(err, chatId);
              bot.sendMessage(chatId, 'There was an issue retrieving data from steam servers');
            });
        } else {
          bot.sendMessage(chatId, 'Could not find account. Have you registered?');
        }
      })
      .catch(function(err) { handleError(err, chatId); });
  });

  // *****************************
  //    Specific match number
  // *****************************
  bot.onText(/#m_(\d+)/, function(msg, match) {
    var chatId = msg.chat.id;
    var matchId = match[1];
    console.log(matchId);

    return sendMatch(chatId, matchId);
  });

  // *****************************
  //    Top Feeds
  // *****************************
  bot.onText(/\/topfeeds/, function(msg) {
    var chatId = msg.chat.id;
    var telegramId = msg.from.id;
    var userName = msg.from.userName;

    bot.sendMessage(chatId, '*RETRIEVING FEEDING DATA*\nOne moment please.', { parse_mode: 'Markdown' });
    var feeds = [];

    var update = /update/.test(msg.text);
    if(update) {
      // Refresh data from dota API
      console.log('feed data update requested');
      bot.sendMessage(chatId, 'Contacting Steam servers. This may take a while...\n');
    }
    getFeeds(update)
      .then(function(feeds) {
        var table = '*TOP FEEDERS OF THE WEEK* (25 Matches)\n\nRANK....NAME....DEATHS\n';
        for (var i = 1; i < feeds.length + 1; i++) {
          var rank = feeds[i-1];
          table = table + i + '.....' + rank.dota_name+'....'+rank.total_vals+'\n';
        }
        bot.sendMessage(chatId, table, { parse_mode: 'Markdown' });

        var footer = 'Congratulations to '+feeds[0].dota_name+'!\nCheck out the match where he fed the most ('+feeds[0].top_vals+' times!)';
        bot.sendMessage(chatId, footer);

        sendMatch(chatId, feeds[0].top_match);
      })
      .catch(function(err) { handleError(err, chatId); });
  });

  // *****************************
  // Helper method to actually retrieve the list of feeds.
  // Returns a promise with the list of feeds
  function getFeeds(update) {
    return new Promise(function(resolve, reject) {
      if(update) {
        valRank('deaths')
          .then(function(feeds) {
            // Serialize to JSON for easy retrieval
            return fs.writeFileAsync(outputFileName, JSON.stringify(feeds));
          })
          .then(function() {
            console.log('New feeds JSON file saved.');
            resolve(feeds);
          })
          .catch(reject);

      } else {
        // Display cached data
        console.log('Loading feed data from cache');
        fs.readFileAsync(outputFileName, 'utf8')
          .then(resolve)
          .catch(reject);
      }
    });
  }

  // *****************************
  // Send a link to the dotabuff page for the match
  function sendMatch(chatId, matchId) {
    var response = '[Requested DotaBuff page for match '+matchId+'](http://dotabuff.com/matches/'+matchId+').';
    return bot.sendMessage(chatId, response, { parse_mode: 'Markdown'})
  }

  // *****************************
  // Builds a news reply
  function newsReply(header, news) {
    var texts  = [
      header,
      '\n*'+news.title+'*',
      news.contents,
      '\nSee the rest of this post here:',
      news.url
    ];
    return texts.join('\n');
  }

  // *****************************
  // Returns ranked dict based on player value.
  // Returns a promise with the ranks
  function valRank(attribute) {
    return User.find().exec()
      .then(function(users) {
        var results = [];
        users.forEach(function(user) {
          var name = user.userName;
          var accountId = user.steamId;
          var vals =getSum(accountId, 7, attribute);
          console.log('vals: ', vals);
        });

        return results;
      });
  }

  // *****************************
  // Gets a zipped list of match_id's with a given player's attribute for each
  // of the player's last 25 matches
  //
  // Returns a promise with the list
  function getSum(accountId, days, attribute) {
      return da.getMatchHistoryAsync({account_id: user.steamId, matches_requested: 25})
        .then(function(result) {
          console.log('returned result: ', result);
          var matches = JSON.parse(result).result.matches;
          var matchIds = [];
          var attrList = [];

          if(matches) {
            for (var i = 0; i < matches.length; i++) {
              var matchId = matches[i].match_id;
              da.getMatchDetailsAsync({match_id: matchId })
                .then(function(result) {
                  console.log('returned result: ', result);
                  var matchDetails = JSON.parse(result).result;
                  var players = matchDetails.players;
                  var playersVal = getPlayerVal(players, accountId, attribute);
                  matchIds.append(matchId);
                  attrList.append(playersVal);
                })
                .catch(function(err) {
                    console.error('Error getting match details: '+err);
                });
            };
          }

          // Zip the match ID's with the attributes and return
          return zip(matchIds, attrList);
        });
  }


  //Takes list of players from match and returns the value of an attribute
  //for a given player, e.g deaths, hero healing, tower damage etc
  function getPlayerVal(players, accountId, attribute) {
    var player = players.find(function(p) { return p.account_id == accountId; });
    if(player) {
      return player[attribute];
    }
    return null;
  }

  function zip() {
      var args = [].slice.call(arguments);
      var shortest = args.length==0 ? [] : args.reduce(function(a,b){
          return a.length<b.length ? a : b
      });

      return shortest.map(function(_,i){
          return args.map(function(array){return array[i]})
      });
  }

  // *****************************
  // Error handler
  function handleError(err, chatId) {
    console.error(err);
  }
}
