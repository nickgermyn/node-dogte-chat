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
var matchScraper = require('../tasks/task.matchScraper');
var statsService = require('../services/statsService');
var winston = require('winston');

module.exports = function(bot) {

	const outputFileName = './data/feeds.json';

	var appId = config.steam.dota.appId;
	var s = new steam({
		apiKey: config.steam.apiKey,
		format: 'json'
	});

	// *****************************
	//		Dota news
	// *****************************
	bot.onText(/^\/news(?:@\w*)?/i, function(msg) {
		var chatId = msg.chat.id;

		s.getNewsForApp({
			appid: appId,
			count: 1,
			maxlength: 300,
			callback: function(err, data) {
				if (err) {
					bot.sendMessage(chatId, 'Request failed. Servers may be down');
					return handleError(err);
				}
				var latestNews = data.appnews.newsitems[0];
				console.log(latestNews);

				var header = '*Latest Dota 2 news post * (' + latestNews.feedlabel + ')';
				try {
					bot.sendMessage(chatId, newsReply(header, latestNews));
				} catch (e) {
					console.error('Couldn\'t parse: ' + latestNews);
				}
			}
		});
	});

	// *****************************
	//		Matches
	// *****************************
	bot.onText(/^\/matches(?:@\w*)?/i, function(msg) {
		var chatId = msg.chat.id;
		var telegramId = msg.from.id;

		// Find account
		User.findOne({telegramId: telegramId}, function(err, user) {
			if (err) return handleError(err, chatId);
			if (user) {
				console.log('found user ' + user.steamId + ' getting match history..');
				da.getMatchHistoryAsync({account_id: user.steamId, matches_requested: 5})
				.then(function(result) {
					var matches = JSON.parse(result).result.matches;
					if (matches) {
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
	//		Last Match
	// *****************************
	bot.onText(/^\/lastmatch(?:@\w*)?/i, function(msg) {
		var chatId = msg.chat.id;
		var telegramId = msg.from.id;

		// Find account
		User.findOne({telegramId: telegramId}).exec()
			.then(function(user) {
				if (user) {
					console.log('found user ' + user.steamId + ' getting match history..');

					return da.getMatchHistoryAsync({account_id: user.steamId, matches_requested: 1})
						.then(function(result) {
							console.log('returned result: ', result);
							var matches = JSON.parse(result).result.matches;
							if (matches) {
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
	//		Specific match number
	// *****************************
	bot.onText(/#m_(\d+)/, function(msg, match) {
		var chatId = msg.chat.id;
		var matchId = match[1];
		console.log(matchId);

		return sendMatch(chatId, matchId);
	});

	// *****************************
	//		Top Feeds
	// *****************************
	bot.onText(/^\/topfeeds(?:@\w*)?/i, function(msg) {
		var chatId = msg.chat.id;
		var testNewCode = false;
		if (!testNewCode) {
			return bot.sendMessage(chatId, 'Not currently supported!');
		} else {
			bot.sendMessage(chatId, '*RETRIEVING FEEDING DATA*\nOne moment please.', { parse_mode: 'Markdown' });
			var update = /update/.test(msg.text);

			// the getFeeds function actually does the refresh of data from the dota API
			return getFeeds(update, function(text) { bot.sendMessage(chatId, text); })
				.then(function(feeds) {
					var table = '*TOP FEEDERS OF THE WEEK* (25 Matches)\n\nRANK....NAME....DEATHS\n';
					for (var i = 1; i < feeds.length + 1; i++) {
						var rank = feeds[i - 1];
						table = table + i + '.....' + rank.displayName + '....' + rank.sum + '\n';
					}
					var footer = 'Congratulations to ' + feeds[0].displayName + '!\n' +
						'Check out the match where he fed the most (' + feeds[0].max + ' times!)';
					return bot.sendMessage(chatId, table, { parse_mode: 'Markdown' })
						.then(() => bot.sendMessage(chatId, footer))
						.then(() => sendMatch(chatId, feeds[0].topGame));
				})
				.catch(err => {
					console.log('err handler...');
					handleError(err, chatId);
				});
		}
	});

	// *****************************
	//		Rebuild match database
	// *****************************
	bot.onText(/^\/rebuild(?:@\w*)?/i, function(msg) {
		return bot.sendMessage(msg.chat.id, 'Rebuilding match database. This may take a while...')
			.then(() => matchScraper.rebuild())
			.then(result => console.log('Rebuild complete'))
			.then(() => bot.sendMessage(msg.chat.id, 'Rebuild complete!'))
			.catch(err => console.error('an error occurred getting average: ', err));
	});

	// *****************************
	//		Get stats
	// *****************************
	bot.onText(/^\/oldstats(?:@\w*)?\b\s*(\w*)/i, function(msg, match) {
		var getAllStats = function() {
			console.log('Getting all stats for user: ' + msg.from.username);
			var a = User.findOne({ telegramId: msg.from.id }).exec();
			var b = a.then(user => Promise.map(statsService.validAttributes, attr => statsService.getStatsForAttribute({
				steamId: user.steamId,
				attribute: attr
			})));
			return Promise.join(a, b, (user, results) => {
				var response = '*STATS FOR ' + user.displayName + ' OVER LAST 25 GAMES*\n';
				response += results.map(r => statsService.formatSingleLine(r) + '\n');
				return bot.sendMessage(msg.chat.id, response, { parse_mode: 'Markdown'});
			})
			.catch(err => {
				console.error('an error occurred getting stats: ', err);
				return bot.sendMessage(msg.chat.id, 'An error occurred');
			});
		};

		var statType = match[1];
		// If not stat type is specified, then get all
		if (!statType) {
			return getAllStats();
		}

		// Otherwise, check that it is valid
		if (statsService.validAttributes.indexOf(statType) === -1) {
			console.log('Invalid stat requested: ' + statType);
			return bot.sendMessage(msg.chat.id, 'Invalid stat requested');
		}

		return User.findOne({ telegramId: msg.from.id }).exec()
			.then(user => statsService.getStatsForAttribute({
				steamId: user.steamId,
				attribute: statType
			}))
			.then(result => bot.sendMessage(msg.chat.id, statsService.format(result)))
			.catch(err => {
				console.error('an error occurred getting stats: ', err);
				return bot.sendMessage(msg.chat.id, 'An error occurred');
			});
	});

	// *****************************
	//		Get better stats
	// *****************************
	bot.onText(/^\/stats(?:@\w*)?/i, function(msg) {
		console.log('Getting stats for user: ' + msg.from.username);
		var a = User.findOne({ telegramId: msg.from.id }).exec();
		var b = a.then(user => statsService.getStatSummary({
			steamId: user.steamId}));

		return Promise.join(a, b, (user, results) => {
			var response = '*STATS FOR ' + user.displayName + ' OVER LAST 25 GAMES*\n';
			for (var property in results) {
				response += property + ': ' + results[property].displayValue;
				if (results[property].match) {
					response += ' ([' + results[property].match + '](http://dotabuff.com/matches/' +
						results[property].match + '))';
				}
				response += '\n';
			}
			return bot.sendMessage(msg.chat.id, response, { parse_mode: 'Markdown'});
		})
		.catch(err => {
			console.error('an error occurred getting stats: ', err);
			return bot.sendMessage(msg.chat.id, 'An error occurred');
		});
	});

	// *****************************
	// Helper method to actually retrieve the list of feeds.
	// Returns a promise with the list of feeds
	function getFeeds(update, sendMessage) {
		function getFromServer() {
			console.log('Requesting data from steam servers...');
			sendMessage('Contacting Steam servers. This may take a while...\n');

			var a = valRank('deaths');
			var b = a.then(function(feeds) {
						// Serialize to JSON for easy retrieval
				return fs.writeFileAsync(outputFileName, JSON.stringify(feeds));
			});
			return Promise.join(a, b, function(feeds, writeFileResult) {
				console.log('New feeds JSON file saved.');
				return feeds;
			});
		}

		if (!update) {
			// Attempt to load cached data
			console.log('Attempting to load feeding data from cache');
			return fs.readFileAsync(outputFileName)
				.then(text => JSON.parse(text))
				.catch(function(err) {
					console.log('Failed to load from cache');
					return getFromServer();
				});
		}

			// Otherwise, just get data from the server
		console.log('Just get data from the server');
		return getFromServer();
	}

	// *****************************
	// Send a link to the dotabuff page for the match
	function sendMatch(chatId, matchId) {
		var response = '[Requested DotaBuff page for match ' + matchId + '](http://dotabuff.com/matches/' + matchId + ').';
		return bot.sendMessage(chatId, response, { parse_mode: 'Markdown'});
	}

	// *****************************
	// Builds a news reply
	function newsReply(header, news) {
		var texts	= [
			header,
			'\n*' + news.title + '*',
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
		console.log('Getting a ranked value dictionary for all users on attribute: ', attribute);

		var getSumMap = function(user) {
			var accountId = user.steamId;

			return getSum(accountId, 7, attribute)
				.then(results => {
					return {
						user: user,
						results: results
					};
				});
		};

		return User.find().exec()
			.then(users => Promise.all(users.map(getSumMap)))
			.then(result => {
				console.log('summarising data...');

				var summarised = result.map((res) => {
					// For each user
					var vals = res.results.map((x) => x[1]);
					var sumOfAttr = vals.reduce((prev, cur) => prev + parseInt(cur));
					var maxAttr = vals.reduce((prev, cur) => { return (cur > prev) ? cur : prev; });
					var topGame = res.results.find((x) => x[1] == maxAttr)[0];
					console.log(res.user.displayName + ' sum: ' + sumOfAttr, ' max: ' + maxAttr + ' in game ' + topGame);

					return {
						displayName: res.user.displayName,
						userName: res.user.userName,
						steamId: res.user.steamId,
						dotaBuffId: res.user.dotaBuffId,
						sum: sumOfAttr,
						max: maxAttr,
						topGame: topGame,
						vals: vals
					};
				});

				return summarised.sort((a, b) => b - a);
			});
	}

	// *****************************
	// Gets a zipped list of match_id's with a given player's attribute for each
	// of the player's last 25 matches
	//
	// Returns a promise with the list
	function getSum(accountId, days, attribute) {
		//console.log('getting match history for account: ', accountId);

		var getDetailsForMatch = function(match) {
			//console.log('getting details for match: ', match.match_id);
			return da.getMatchDetailsAsync({match_id: match.match_id })
				.then(result => {
					var matchDetails = JSON.parse(result).result;
					//console.log('matchDetails.players', matchDetails.players);
					var players = matchDetails.players;
					var playersVal = getPlayerVal(players, accountId, attribute);
					//console.log('playersVal: ', playersVal);
					return playersVal;
				})
				.catch(function(err) {
					console.error('Error getting match ' + match.match_id + ' details: ' + err);
				});
		};

		return da.getMatchHistoryAsync({account_id: accountId, matches_requested: 25})
			.then(result => {
				var matches = JSON.parse(result).result.matches || [];
				var matchIds = matches.map(function(m) { return m.match_id; });
				return Promise
					.all(matches.map(getDetailsForMatch))
					.then(function(details) {
						// Zip the match ID's with the attributes and return
						return zip(matchIds, details);
					});
			});
	}


	//Takes list of players from match and returns the value of an attribute
	//for a given player, e.g deaths, hero healing, tower damage etc
	function getPlayerVal(players, accountId, attribute) {
		var player = players.find(function(p) { return p.account_id == accountId; });
		if (player) {
			return player[attribute];
		}
		return null;
	}

	function zip() {
		var args = [].slice.call(arguments);
		var shortest = args.length == 0 ? [] : args.reduce(function(a, b) {
			return a.length < b.length ? a : b;
		});

		return shortest.map(function(_, i) {
			return args.map(function(array) { return array[i]; });
		});
	}

	// *****************************
	// Error handler
	function handleError(err, chatId) {
		console.error(err);
	}
};
