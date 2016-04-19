/**
 * User account handlers
 */

'use strict';

var User = require('../models/user');
var steam = require('steam-web');
var config = require('../config/environment');
var da = require('dota2-api').create(config.steam.apiKey);

module.exports = function(bot) {

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
        findMatches(user.steamId, function(matches) {
          if(matches) {
            //TODO: send list of matches back
          }
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
    User.findOne({telegramId: telegramId}, function(err, user) {
      if(err) return handleError(err, chatId);
      if(user) {
        console.log('found user '+user.steamId+' getting match history..');
        findMatches(user.steamId, function(matches) {
          if(matches) {
            console.log('Found matches. Building response...');
            return sendMatch(chatId, matches[0].match_id);
          }
          console.log('no matches found');
        });
      } else {
        bot.sendMessage(chatId, 'Could not find account. Have you registered?');
      }
    });
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
  // Send a link to the dotabuff page for the match
  function sendMatch(chatId, matchId) {
    var response = '[Requested DotaBuff page for match '+matchId+'](http://dotabuff.com/matches/'+matchId+').';
    return bot.sendMessage(chatId, response, { parse_mode: 'Markdown'})
  }

  // *****************************
  // Error handler
  function handleError(err, chatId) {
    console.error(err);
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
  // Gets a list of the last 5 matches
  function findMatches(steamId, callback) {
      da.getMatchHistory({account_id: steamId, matches_requested: 5}, function(err, result) {
        if(err) return handleError(err);
        callback(JSON.parse(result).result.matches);
      });
  }
}
