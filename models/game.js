'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var moment = require('moment');

var gameSchema = new Schema({
  gameTime: Date,
  chatId: Number,
  createdTimestamp: { type: Date, default: Date.now },
  complete: { type: Boolean, default: false },
  notified: { type: Boolean, default: false },
  shotguns: [String],
  rdys: [String]
});

gameSchema.methods.sendTimeUpdate = function(bot, chatId) {
  var now = new Date();
  var when = '';
  var gameTime = moment(this.gameTime);

  if(now > this.gameTime) {
    when = 'Dota already began at ' + gameTime.format('HH:mm') + ' (' + moment().to(gameTime) + ')';
  } else {
    when = 'Dota will begin at ' + gameTime.format('HH:mm') + ' (' + moment().to(gameTime) + ')';
  }
  var response = when + '\n' + this.shotguns.join(', ');
  bot.sendMessage(chatId, response);
}
gameSchema.methods.sendStackUpdate = function(bot, chatId) {
  var gameTime = moment(this.gameTime);

  var rdyCount = this.rdys.length;
  var shotCount = this.shotguns.length;
  var response = '';

  if(shotCount == 5) {
    response = '%mahn with: \n' + this.shotguns.join(', ') + '\n';
    response = response + 'Currently ready: \n' + this.rdys.join(', ');
  } else if (shotCount < 5) {
    response = 'No stack yet. Shotgunned: \n' + this.shotguns.join(', ') + '\n';
    response = response + 'Currently ready: \n' + this.rdys.join(', ');
  } else {
    response = 'Too many bros: \n' + this.shotguns.join(', ') + '\n';
  }

  bot.sendMessage(chatId, response);
}

gameSchema.methods.sendShotgunUpdate = function(bot, chatId) {
  var gameTime = moment(this.gameTime);
  var response = 'You have shotgunned for dota at '+gameTime.format('HH:mm')+' with:';
  response = response + '\n' + this.shotguns.join(', ');
  return bot.sendMessage(chatId, response);
}
gameSchema.methods.sendReadyupUpdate = function(bot, chatId) {
  var gameTime = moment(this.gameTime);
  var response = 'You have readied-up for dota at '+gameTime.format('HH:mm')+' with:';
  response = response + '\n' + this.rdys.join(', ');
  return bot.sendMessage(chatId, response);
}

gameSchema.methods.shotgun = function(userName) {
  if(!this.shotguns) {
    this.shotguns = [userName];
  }
  if(this.shotguns.indexOf(userName) === -1) {
    this.shotguns.push(userName);
  }
}
gameSchema.methods.unshotgun = function(userName) {
  if(this.shotguns && this.shotguns.indexOf(userName) !== -1) {
    this.shotguns.remove(userName);
  }
}
gameSchema.methods.readyup = function(userName) {
  if(!this.rdys) {
    this.rdys = [userName];
  }
  if(this.rdys.indexOf(userName) === -1) {
    this.rdys.push(userName);
  }
  if(!this.shotguns) {
    this.shotguns = [userName];
    return {
      shotgun: true
    };
  }
  if(this.shotguns.indexOf(userName) === -1) {
    this.shotguns.push(userName);
    return { shotgun: true };
  }
  return { shotgun: false };
}

gameSchema.methods.unreadyup = function(userName) {
  if(this.rdys && this.rdys.indexOf(userName) !== -1) {
    this.rdys.remove(userName);
  }
}

gameSchema.methods.hasExpired = function() {
  if(this.complete) {
    return false;
  }
  var gameTime = moment(this.gameTime);
  var now = moment();

  return now.isAfter(gameTime.add(2, 'hours'));
}
gameSchema.methods.shouldBeNotified = function() {
  if(this.notified) {
    return false;
  }
  var gameTime = moment(this.gameTime);
  var now = moment();

  return now.add(15, 'minutes').isAfter(gameTime);
}
gameSchema.methods.timeToStart = function() {
  var gameTime = moment(this.gameTime);
  return gameTime.fromNow();
}

module.exports = mongoose.model('Game', gameSchema);
