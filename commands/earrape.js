const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('earrape')
		.setDescription('Adds earrape filter'),
	async execute(interaction) {
		await interaction.deferReply();

		const { player } = require('../index');
		const queue = player.getQueue(interaction.guildId);

		if (!queue || !queue.playing) {
			return void interaction.followUp({
				content: "❌ | No music is being played!"
			});
		}
		await queue.setFilters({
			earrape: !queue.getFiltersEnabled().includes("earrape"),
			normalizer2: !queue.getFiltersEnabled().includes("earrape") // because we need to toggle it with bass
		});

		return void interaction.followUp({ content: `🎵 | Earrape ${queue.getFiltersEnabled().includes("earrape") ? "Enabled" : "Disabled"}!` });
	}
};