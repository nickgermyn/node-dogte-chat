'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var matchSchema = new Schema({
	matchId: Number,
	startTime: Date,
	duration: Number, // Seconds
	/*
		0 = None
		1 = All Pick
		2 = Captain's Mode
		3 = Random Draft
		4 = Single Draft
		5 = All Random
		6 = Intro
		7 = Diretide,
		8 = Reverse captain's mode
		9 = The Greeviling
		10 = Tutorial
		11 = Mid Only
		12 = Least Played
		13 = New Player Pool
		14 = Compendium Matchmaking
		16 = Caprains Draft
	*/
	gameMode: Number,
	players: [{
		accountId: Number,
		/*
			A player's slot is returned via an 8-bit unsigned integer.
			The first bit represent the player's team, false if Radiant and true if dire.
			The final three bits represent the player's position in that team, from 0-4.

			┌─────────────── Team (false if Radiant, true if Dire).
			│ ┌─┬─┬─┬─────── Not used.
			│ │ │ │ │ ┌─┬─┬─ The position of a player within their team (0-4).
			│ │ │ │ │ │ │ │
			0 0 0 0 0 0 0 0
		*/
		playerSlot: Number,
		heroId: Number,
		kills: Number,
		deaths: Number,
		assists: Number,
		lastHits: Number,
		denies: Number,
		goldPerMin: Number,
		xpPerMin: Number,
		level: Number,
		gold: Number,
		goldSpent: Number,
		heroDamage: Number,
		towerDamage: Number,
		heroHealing: Number,
	}],
	result: {
		radiantWin: Boolean,
		/*
			A particular teams tower status is given as a 16-bit unsigned integer.
			The rightmost 11 bits represent individual towers belonging to that team;
			see below for a visual representation.

				┌─┬─┬─┬─┬─────────────────────── Not used.
				│ │ │ │ │ ┌───────────────────── Ancient Bottom
				│ │ │ │ │ │ ┌─────────────────── Ancient Top
				│ │ │ │ │ │ │ ┌───────────────── Bottom Tier 3
				│ │ │ │ │ │ │ │ ┌─────────────── Bottom Tier 2
				│ │ │ │ │ │ │ │ │ ┌───────────── Bottom Tier 1
				│ │ │ │ │ │ │ │ │ │ ┌─────────── Middle Tier 3
				│ │ │ │ │ │ │ │ │ │ │ ┌───────── Middle Tier 2
				│ │ │ │ │ │ │ │ │ │ │ │ ┌─────── Middle Tier 1
				│ │ │ │ │ │ │ │ │ │ │ │ │ ┌───── Top Tier 3
				│ │ │ │ │ │ │ │ │ │ │ │ │ │ ┌─── Top Tier 2
				│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ┌─ Top Tier 1
				│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
				0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
		*/
		towerStatusRadiant: Number,
		towerStatusDire: Number,
		/*
			A particular teams tower status is given as an 8-bit unsigned integer.
			The rightmost 6 bits represent the barracks belonging to that team;
			see below for a visual representation.

				┌─┬───────────── Not used.
				│ │ ┌─────────── Bottom Ranged
				│ │ │ ┌───────── Bottom Melee
				│ │ │ │ ┌─────── Middle Ranged
				│ │ │ │ │ ┌───── Middle Melee
				│ │ │ │ │ │ ┌─── Top Ranged
				│ │ │ │ │ │ │ ┌─ Top Melee
				│ │ │ │ │ │ │ │
				0 0 0 0 0 0 0 0
		*/
		barracksStatusRadiant: Number,
		barracksStatusDire: Number,
		cluster: Number,
		firstBloodTime: Number, // Seconds
		radiantScore: Number, // Kills
		direScore: Number // Kills
	}
});

module.exports = mongoose.model('Match', matchSchema);
