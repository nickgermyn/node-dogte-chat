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

describe('handler.game', function gameHandlerSuite() {
  describe('#gameCreation', function gameCreationSuite() {
    it('should extract the hours and minutes from message "/dota at 1930"', function test(done) {
      const bot = new TelegramBot(TOKEN, { webHook: true });
      bot.onText(/^\/dog?t[ea]s?(?:@\w*)?\b\s*(?=(?:.*\b(\d{2})[:.;-]?(\d{2})\b)?)(.+)?/i, (msg, match) => {
        bot._WebHook._webServer.close();
        try {
          expect(match[1]).to.equal('19');
          expect(match[2]).to.equal('30');
          done();
        } catch (e) {
          done(e);
        }
      });
      const url = `http://localhost:8443/bot${TOKEN}`;
      request({
        url,
        method: 'POST',
        json: true,
        headers: {
          'content-type': 'application/json',
        },
        body: { update_id: 0, message: { text: '/dota at 1930' } }
      });
    });

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
  });
});
