require('dotenv').config();

module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldState, newState) {
		const { player } = require('../../index');
		// Joined VC without being connected to one previously
		if (oldState.channelId === null && newState.channelId !== null) {
			console.log(`${newState.member.user.username} joined ${newState.member.voice.channel.name}`);
		}
		// Left VC without joining another
		else if (newState.channelId === null) {
			const queue = player.getQueue(newState.guild.id);

			if (queue) {
				const left_tracks = [];
				queue.tracks.forEach(value => {
					if (value.requestedBy.username === newState.member.user.username) {
						left_tracks.push(value);
					}
				});
				if (left_tracks.length > 0) {
					const filter = (reaction, user) => {
						return ['✅', '❌'].includes(reaction.emoji.name) && !user.bot && newState.member.user.username !== user.username;
					};

					const message = await queue.metadata.send({
						content: `Looks like **${newState.member.user.username}** left with some songs in the queue. Would you like me to remove them?`,
					});
					message.react('✅').then(() => message.react('❌'));

					const collector = message.createReactionCollector({ filter, time: 60000, errors: ['time'] });

					collector.on('collect', reaction => {
						if (reaction.emoji.name === '✅') {
							collector.stop('yes');
						}
						else if (reaction.emoji.name === '❌') {
							collector.stop('no');
						}
					});

					collector.on('end', (collected, reason) => {
						if (reason === 'yes') {
							const tracks = left_tracks.slice(0, 10).map((m, i) => {
								return `${i + 1}. [**${m.title}**](${m.url})`;
							});
							left_tracks.forEach(value => {
								queue.remove(value);
							});
							message.edit({
								embeds: [{
									title: 'Removed',
									description: `${tracks.join('\n')}${left_tracks.length > tracks.length
										? `\n...${left_tracks.length - tracks.length === 1 ? `${left_tracks.length - tracks.length} more track` : `${left_tracks.length - tracks.length} more tracks`}`
										: ''
									}`,
									color: 0xff0000,
								}],
							});
						}
						else if (reason === 'no') {
							message.edit('👍');
						}
						else {
							message.edit('Voting timed out');
						}
						message.reactions.removeAll()
							.catch(error => console.error('Failed to clear reactions:', error));
					});
				}
			}
		}
	},
};