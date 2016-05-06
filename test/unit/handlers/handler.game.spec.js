'use strict';

const expect = require('chai').expect;
const request = require('request-promise');
const TelegramBot = require('node-telegram-bot-api');
//const gameHandler = require('../../../lib/handlers/handler.game');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const TOKEN = process.env.TEST_TELEGRAM_TOKEN;
if (!TOKEN) {
  throw new Error('Bot token not provided');
}

// This should be extracted into another file and imported
const sendMessage = (bot, message) => {
  bot.textRegexpCallbacks.forEach((reg) => {
    const result = reg.regexp.exec(message.text);
    if (result) {
      reg.callback(message, result);
    }
  });
};

describe('handler.game', function gameHandlerSuite() {
  describe('#gameCreation', function gameCreationSuite() {
    // Example from the node-telegram-bot-api github project
    it('should call `onText` callback on match', function test(done) {
      const bot = new TelegramBot(TOKEN, { webHook: true });
      bot.onText(/\/echo (.+)/, (msg, match) => {
        bot._WebHook._webServer.close();
        expect(match[1]).to.equal('ECHO ALOHA');
        done();
      });
      const url = `http://localhost:8443/bot${TOKEN}`;
      request({
        url,
        method: 'POST',
        json: true,
        headers: {
          'content-type': 'application/json',
        },
        body: { update_id: 0, message: { text: '/echo ECHO ALOHA' } }
      });
    });

    // My re-working of their example
    it('should extract the hours and minutes from message "/dota at 1930"', function test(done) {
      const bot = new TelegramBot(TOKEN);
      bot.onText(/^\/dog?t[ea]s?(?:@\w*)?\b\s*(?=(?:.*\b(\d{2})[:.;-]?(\d{2})\b)?)(.+)?/i, (msg, match) => {
        try {
          expect(match[1]).to.equal('19');
          expect(match[2]).to.equal('30');
          done();
        } catch (e) {
          done(e);
        }
      });
      sendMessage(bot, { text: '/dota at 1930' });
    });

    it('should add a day to the specified time if it is in the past', function test() {
      const now = new Date(2016, 5, 6, 20, 0);
      var gameTime = new Date(2016, 5, 6, 19, 30);

      // Check if the time is in the past. If it is, then need to add a day
      if (gameTime < now) {
        gameTime.setDate(gameTime.getDate() + 1);
      }

      expect(gameTime.getDate()).to.equal(7);
      expect(gameTime.getHours()).to.equal(19);
      expect(gameTime.getMinutes()).to.equal(30);
    });
  });
});
