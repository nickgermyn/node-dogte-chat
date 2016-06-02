'use strict';
process.env.NODE_ENV = 'test';

const config = require('../lib/config/environment');
const chai = require('chai');
var should = chai.should();
const mocks = require('./mocks');
//require('./mongoTestSetup');
const mongoose = require('mongoose');
require('mocha-mongoose')(config.mongo.uri);

const gameHandler = require('../lib/handlers/handler.game.js');
const Game = require('../lib/models/game');

const buildMessage = function(text) {
  return {
    text: text,
    chat: { id: 1 },
    from: {
      first_name: 'first',
      last_name: 'last',
    }
  };
};

describe('handler.game', function gameHandlerSuite() {
  /* Tests to prove that the regex works */
  describe('regexTesting', function regexTestingSuite() {
    let bot;
    beforeEach(() => {
      bot = new mocks.Bot();
    });

    // My re-working of their example
    it('should extract the hours and minutes from message "/dota at 1930"', function test(done) {
      bot.onText(/^\/dog?t[ea]s?(?:@\w*)?\b\s*(?=(?:.*\b(\d{2})[:.;-]?(\d{2})\b)?)(.+)?/i, (msg, match) => {
        try {
          match[1].should.equal('19');
          match[2].should.equal('30');
          done();
        } catch (e) {
          done(e);
        }
      });
      bot.simulateMessage({ text: '/dota at 1930' });
    });

    it('should match message "/dota zzzz"', function test(done) {
      bot.onText(/^\/dog?t[ea]s?(?:@\w*)?\b\s*(?=(?:.*\b(\d{2})[:.;-]?(\d{2})\b)?)(.+)?/i, (msg, match) => {
        try {
          should.not.exist(match[1]);
          should.not.exist(match[2]);
          match[3].should.equal('zzzz');
          done();
        } catch (e) {
          done(e);
        }
      });
      bot.simulateMessage({ text: '/dota zzzz' });
    });

    it('should not match this expression', function test() {
      var called = false;
      bot.onText(/^\/dog?t[ea]s?(?:@\w*)?\b\s*(?=(?:.*\b(\d{2})[:.;-]?(\d{2})\b)?)(.+)?/i, (msg, match) => {
        called = true;
      });
      bot.simulateMessage({ text: '/blah' });
      called.should.equal(false);
    });

    it('should add a day to the specified time if it is in the past', function test() {
      const now = new Date(2016, 5, 6, 20, 0);
      var gameTime = new Date(2016, 5, 6, 19, 30);

      // Check if the time is in the past. If it is, then need to add a day
      if (gameTime < now) {
        gameTime.setDate(gameTime.getDate() + 1);
      }

      gameTime.getDate().should.equal(7);
      gameTime.getHours().should.equal(19);
      gameTime.getMinutes().should.equal(30);
    });
  });

  /* Tests to prove the actual handler */
  describe('#gameCreation', function gameCreationSuite() {
    let bot;

    // Make a new instance of the bot for each test
    // Register all of the handlers each time as well
    beforeEach(done => {
      bot = new mocks.Bot();
      gameHandler(bot);

      // Connect to mongodb if required
      if (mongoose.connection.db) return done();
      mongoose.connect(config.mongo.uri, done);
    });

    it('should return an unrecognised command message on bad command', () => {
      const msg = buildMessage('/dota zzzzzzzz');
      bot.simulateMessage(msg);
      bot.sentMessages.should.have.lengthOf(1);
      bot.sentMessages[0].message.should.contain('Unrecognised command');
    });

    it('should create a game on good time', done => {
      const msg = buildMessage('/dota at 1930');
      bot.simulateMessage(msg).then(() => {
        bot.sentMessages.should.have.lengthOf(1);

        // Load all games
        Game.find({}, function(err, games) {
          if (err) done(err);
          try {
            games.should.have.lengthOf(1);
            const theGame = games[0];
            theGame.gameTime.getHours().should.equal(19);
            theGame.gameTime.getMinutes().should.equal(30);
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });
});
