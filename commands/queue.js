const {SlashCommandBuilder} = require('@discordjs/builders');
const {getQueuePage, PAGE_SIZE} = require('../utilities');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('queue')
      .setDescription('See the queue'),
  async execute(interaction) {
    await interaction.deferReply();

    const {player} = require('../index');
    const queue = player.getQueue(interaction.guildId);

    if (!queue || !queue.playing) {
      return void interaction.followUp({
        content: '❌ | No music is being played!',
      });
    }

    if (queue.tracks.length === 0) {
      return void interaction.followUp({
        content: 'No song in the queue!',
      });
    }

    const noOfPages = Math.floor(queue.tracks.length / PAGE_SIZE);
    const pages = [];
    let pageNumber = 0;
    const count = queue.usersTrackCount();
    const usersCount = [];

    for (const [key, value] of Object.entries(count)) {
      usersCount.push(`${key}: ${value}`);
    }

    for (let i = 0; i <= noOfPages * PAGE_SIZE; i += PAGE_SIZE) {
      const page = queue.tracks.slice(i, i + PAGE_SIZE);
      pages.push(page);
    }
    const message = await interaction.followUp(
        getQueuePage(queue, pageNumber, pages, usersCount),
    );

    if (noOfPages > 0) {
      const filter = (reaction, user) => {
        return ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot;
      };
      message.react('⬅️').then(() => message.react('➡️'));
      const collector = message.createReactionCollector({
        filter,
        max: 10,
        errors: ['time'],
        dispose: true,
      });

      collector.on('collect', (reaction) => {
        if (reaction.emoji.name === '➡️' && pageNumber < pages.length - 1) {
          pageNumber++;
        } else if (reaction.emoji.name === '⬅️' && pageNumber > 0) {
          pageNumber--;
        }

        message.edit(getQueuePage(queue, pageNumber, pages));
      });

      collector.on('remove', (reaction) => {
        if (reaction.emoji.name === '➡️' && pageNumber < pages.length - 1) {
          pageNumber++;
        } else if (reaction.emoji.name === '⬅️' && pageNumber > 0) {
          pageNumber--;
        }
        message.edit(getQueuePage(queue, pageNumber, pages));
      });

      collector.on('end', () => {
        message.delete();
      });

      player.on('trackStart', () => {
        collector.stop('New Song');
      });

      player.on('trackAdd', () => {
        collector.stop('New Song');
      });

      player.on('tracksAdd', () => {
        collector.stop('New Song');
      });
    }
  },
};
