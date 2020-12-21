const Discord = require('discord.js');
const query = require('source-server-query');
const config = require('../config/settings.json');

const connecting = 'Connecting into the server...';

console.clear();
config.servers.forEach((srv, id) => {
	let oldStatus = null;
	let server = config.servers[id];
	server.bot = new Discord.Client();
	server.bot.login(server.token);

	// The bot is connected
	server.bot.on('ready', () => {
		console.log('* Logged in as', server.bot.user.tag);
		server.bot.user.setStatus('dnd');
		server.bot.user.setActivity(connecting, { type: 'WATCHING' });
		serverQuery();
	});

	// Error catch of the Discord API
	server.bot.on('error', (err) => {
		server.bot.user.setStatus('dnd');
		server.bot.user.setActivity(connecting, { type: 'WATCHING' });
		console.error('* An error occurred (Discord API):', err);
	});

	// Source query
	function serverQuery() {
		query
			.players(server.ip, server.port, server.timeout)
			.then(() => {
				query
					.info(server.ip, server.port, server.timeout)
					.then((res) => {
						server.playersNumber = res.playersnum;
						server.maxPlayers = res.maxplayers;
						server.map = res.map;
					})
					.then(() => {
						currentStatus = `${server.playersNumber},${server.maxPlayers},${server.map}`;
						setBotStatus(currentStatus);
					});
			})
			// Catch source query errors
			.catch((err) => {
				server.bot.user.setStatus('dnd');
				server.bot.user.setActivity(connecting, { type: 'WATCHING' });
				console.error('* An error occurred (Server Query):', err);
			});
	}

	// Prevent flood from Discord API with unnecessary requests (Credits to github.com/Killa4)
	function setBotStatus(currentStatus) {
		if (currentStatus === oldStatus) {
			return;
		} else {
			oldStatus = currentStatus;
			currentStatus = currentStatus.split(',');

			// If the server is full
			if (currentStatus[0] == currentStatus[1]) {
				server.bot.user.setStatus('idle');
				server.bot.user.setActivity(
					`(${currentStatus[0]}/${currentStatus[1]}) | ${currentStatus[2]}`,
					{ type: 'WATCHING' }
				);
				return;
			}

			server.bot.user.setStatus('online');
			server.bot.user.setActivity(
				`(${currentStatus[0]}/${currentStatus[1]}) | ${currentStatus[2]}`,
				{ type: 'WATCHING' }
			);
			return;
		}
	}

	setInterval(serverQuery, config.refresh);
});
