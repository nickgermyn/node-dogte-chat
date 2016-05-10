# node-dogte-chat

## Getting Started

Before you start, make sure you have a working [NodeJS](http://nodejs.org/) environment, preferably with NPM 3.

Ensure that the following environmental variables are set:

* `TELEGRAM_BOT_TOKEN=<your token>`
* `STEAM_API_KEY=<your api key>`

From the project folder, execute the following command:

```shell
npm install
```

This will install all required dependencies.

To run the app execute the following command:

```shell
npm run start
```

This command starts the node.js app

## Development
To run the unit tests execute the following command:

```shell
npm test
```

## Usage

###THE DATABASE
* `/register steam:<steam_id> dotabuff:<dotabuff player id>` - Registers user
* `/account` - Displays the current user account details
* `/delete_account` - Deletes the users account.

###DOTA EVENTS
* `/dota` - creates a new dota event or modifies an existing event's time:
    * `/dota at 18:45`
    * `/dota at 18.45`
    * `/dota at 1845`
    * `/dota at 18:45 with alice, bob` (will shotgun alice and bob)
    * `/dota`

* `/delete_dota` - will remove the current dota event
* `/shotgun` - shotgun for dota
* `/unshotgun` - Remove yourself from the shotgun (and ready) list.
* `/rdy` - ready up
* `/unrdy` - Remove yourself from the ready list

###DOTA 2/STEAM API REQUESTS
* `/topfeeds` - **Not currently implemented** See who died the most recently. Add the 'update' argument to refresh the list
* `/lastmatch` - Post your last match details
* `/news` - latest dota 2 news post

If a message is asking if or when dota is happening, or if there is a 5 stack, dogtebot will answer
