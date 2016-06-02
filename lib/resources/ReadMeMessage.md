With the powers invested in me by Lord Gaben, I respond to the following commands and actions:

*Commands:*

*THE DATABASE*
`/register steam:<steam_id> dotabuff:<dotabuff player id>` - Registers user
`/account` - Displays the current user account details
`/delete_account` - Deletes the users account.

*DOTA EVENTS*
`/dota` - creates a new dota event or modifies an existing event's time:
    "*/dota at 18:45*"
    "*/dota at 18.45*"
    "*/dota at 1845*"
    "*/dota at 18:45 with alice, bob*" (will shotgun alice and bob)
    "*/dota*"

`/delete_dota` - will remove the current dota event
`/shotgun` - shotgun for dota
`/unshotgun` - Remove yourself from the shotgun (and ready) list.
`/rdy` - ready up
`/unrdy` - Remove yourself from the ready list

*DOTA 2/STEAM API REQUESTS*
`/topfeeds` - See who died the most recently. Add the 'update' argument to refresh the list
`/lastmatch` - Post your last match details
`/news` - latest dota 2 news post

*CUSTOM COMMANDS*
`/setcommand <cmd> <action>` - registers a custom command that can execute an action. e.g.:
    "*/setcommand /funny sendPhoto('123')*" would send the photo with file_id '123'
`/listcommands` - lists all registered Commands
`/deletecommand <cmd>` - deletes the specified command

If a message is asking if or when dota is happening, or if there is a 5 stack, dogtebot will answer
