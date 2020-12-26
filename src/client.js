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
		console.log(
			`* Logged in as ${server.bot.user.tag}, assigned server: ${server.ip}:${server.port}`
		);
		server.bot.user.setPresence({
			activity: { name: connecting, type: 'WATCHING' },
			status: 'dnd',
		});
		serverQuery();
	});

	// Catch Discord API errors
	server.bot.on('error', (err) => {
		console.error('* An error occurred (Discord API):', err);
	});

	// Source query
	function serverQuery() {
		query
			.info(server.ip, server.port, server.timeout)
			.then((res) => {
				currentStatus = `${res.playersnum},${res.maxplayers},${res.map}`;
				setBotStatus(currentStatus);
			})
			// Catch source query errors
			.catch((err) => {
				server.bot.user.setPresence({
					activity: { name: connecting, type: 'WATCHING' },
					status: 'dnd',
				});
				console.error('* An error occurred (Server Query):', err);
			})
			.finally(query.close);
	}

	// Prevent flooding the Discord API with unnecessary requests (Credits to github.com/Killa4)
	function setBotStatus(currentStatus) {
		if (currentStatus === oldStatus) {
			return;
		}

		oldStatus = currentStatus;
		currentStatus = currentStatus.split(',');

		// Handle any kind of undefined errors
		if (
			currentStatus[0] == 'undefined' ||
			currentStatus[1] == 'undefined' ||
			currentStatus[2] == 'undefined'
		) {
			server.bot.user.setPresence({
				activity: { name: connecting, type: 'WATCHING' },
				status: 'dnd',
			});
			return;
		}

		if (currentStatus[0] == '0') {
			server.bot.user.setPresence({
				activity: {
					name: 'There are no players connected.',
					type: 'WATCHING',
				},
				status: 'idle',
			});
			return;
		}

		// If the server is full
		if (currentStatus[0] == currentStatus[1]) {
			server.bot.user.setPresence({
				activity: {
					name: `(${currentStatus[0]}/${currentStatus[1]}) | ${currentStatus[2]}`,
					type: 'WATCHING',
				},
				status: 'idle',
			});
			return;
		}

		// Is not full
		server.bot.user.setPresence({
			activity: {
				name: `(${currentStatus[0]}/${currentStatus[1]}) | ${currentStatus[2]}`,
				type: 'WATCHING',
			},
			status: 'online',
		});
		return;
	}

	setInterval(serverQuery, config.refresh);
});
