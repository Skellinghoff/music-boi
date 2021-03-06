/* eslint-disable max-len */
// eslint-disable-next-line no-unused-vars
const {Queue, Track} = require('discord-player');
const {MessageEmbed} = require('discord.js');

const MINUTES_TO_SECONDS = 60;
const HOURS_TO_SECONDS = MINUTES_TO_SECONDS * 60;
const DAYS_TO_SECONDS = HOURS_TO_SECONDS * 24;
const PAGE_SIZE = 5;

/**
 * It parses 00:00:00 into seconds
 * @param {String} timestamp
 * @return {number}
 */
function timeStampToSeconds(timestamp) {
  const semiCount = (timestamp.match(/:/g) || []).length;
  const splits = timestamp.split(':');

  let seconds = parseInt(splits[semiCount]);
  if (semiCount >= 1) {
    const minutes = parseInt(splits[semiCount - 1]);
    seconds += minutes * MINUTES_TO_SECONDS;
    if (semiCount >= 2) {
      const hours = parseInt(splits[semiCount - 2]);
      seconds += hours * HOURS_TO_SECONDS;
      if (semiCount >= 3) {
        const days = parseInt(splits[semiCount - 3]);
        seconds += days * DAYS_TO_SECONDS;
      }
    }
  }
  return seconds;
}

/**
 * It returns number into 00:00:00 or 00:00 format
 * @param {number} endTime
 * @param {number} seconds
 * @return {string}
 */
function secondsToTimeStamp(endTime, seconds = endTime) {
  if (endTime >= HOURS_TO_SECONDS) {
    return new Date(seconds * 1000).toISOString().slice(11, 19);
  } else {
    return new Date(seconds * 1000).toISOString().slice(14, 19);
  }
}

/**
 * Get wait time of newest Track
 * @param {Queue} queue
 * @param {Number} position
 * @return {string}
 */
function getWaitTime(queue, position = queue.tracks.length - 1) {
  const tracks = queue.tracks;
  let waitTime = 0;

  for (let i = 0; i < position; i++) {
    waitTime += tracks[i].durationMS;
  }

  // const slicedTracks = tracks.slice(0, position)
  // slicedTracks.forEach((track) => {
  //   waitTime += track.durationMS;
  // });
  const currentTrackCurrentTime = timeStampToSeconds(
      queue.getPlayerTimestamp().current,
  );
  const currentTrackEndTime = timeStampToSeconds(
      queue.getPlayerTimestamp().end,
  );

  waitTime /= 1000;
  waitTime += currentTrackEndTime - currentTrackCurrentTime;

  return secondsToTimeStamp(waitTime);
}

/**
 * Gets total duration time of track array
 * @param {Track[]} tracks
 * @return {string}
 */
function playlistDuration(tracks) {
  let totalTime = 0;
  tracks.forEach((element) => {
    totalTime += element.durationMS;
  });
  totalTime /= 1000;

  return secondsToTimeStamp(totalTime);
}

/**
 * Gets embeded Queue page
 * @param {Queue} queue
 * @param {Number} pageNumber
 * @param {Any[]} pages
 * @param {Any[]} usersCount
 * @return {*}
 */
function getQueuePage(queue, pageNumber, pages, usersCount) {
  const embeds = [];
  const currentPage = pages[pageNumber];
  console.log(currentPage);

  const titleEmbed = new MessageEmbed()
      .setColor('WHITE')
      .setAuthor({
        name: `${queue.guild.name}`,
        iconURL: queue.guild.iconURL() ? `${queue.guild.iconURL()}` : '',
      })
      .setTitle(`Queue for **${queue.connection.channel.name}**`)
      .addField('Users', `\`\`\`${usersCount.join('\n')}\`\`\``, true)
      .addField('Number of Tracks', `\`\`\`${queue.tracks.length}\`\`\``, true)
      .addField(
          'Total Time',
          `\`\`\`${secondsToTimeStamp(queue.totalTime)}\`\`\``,
          true,
      );

  embeds.push(titleEmbed);

  currentPage.forEach((track, index, array) => {
    let channelAuthorURL = null;
    try {
      channelAuthorURL = track.raw.channel.url;
    } catch {
      console.log('No channelAuthorURL');
    }

    embeds.push(
        new MessageEmbed()
            .setColor('WHITE')
            .setAuthor({
              name: `${track.author}`,
              iconURL: `${channelAuthorURL}`,
            })
            .setTitle(`${pageNumber * PAGE_SIZE + index + 1}. ${track.title}`)
            .setThumbnail(track.thumbnail)
            .addField('Duration', track.duration, true)
            .addField(
                'Wait Time',
                getWaitTime(queue, pageNumber * PAGE_SIZE + index),
                true,
            )
            .setFooter({
              text:
            index === array.length - 1 && pages.length !== 1 ?
              `Requested by ${track.requestedBy.username}\nPage ${
                pageNumber + 1
              } of ${pages.length}` :
              `Requested by ${track.requestedBy.username}`,
              iconURL: `${track.requestedBy.displayAvatarURL()}`,
            }),
    );
  });

  return {embeds: embeds};
}

module.exports = {
  timeStampToSeconds,
  secondsToTimeStamp,
  getWaitTime,
  playlistDuration,
  getQueuePage,
  PAGE_SIZE,
};
