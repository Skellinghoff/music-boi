require('dotenv').config();
const fs = require('fs');
const {Client, Intents, Collection} = require('discord.js');
const {Player, AudioFilters} = require('discord-player');
const {main} = require('./prototypes');
const path = require('path');

AudioFilters.defineBulk(
    [
      {
        name: 'underwater',
        value: 'firequalizer=gain=\'if(lt(f,1000), 0, -INF)\'',
      },
      {
        name: 'bitcrush',
        value: 'acrusher=mix=1:samples=10'},
      {
        name: 'double_speed',
        value: 'atempo=2'},
      {
        name: 'half_speed',
        value: 'atempo=0.5'},
      {
        name: 'echo',
        value: 'bass=g=-10:f=110:w=0.3, aecho=1.0:1.0:80:0.2, bass=g=10:f=110:w=0.3'},
      // {
      //   name: 'bassboost_low_custom',
      //   value: `bass=g=10:f=110:w=0.3`},
    ],
);

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  partials: ['CHANNEL', 'MESSAGE', 'REACTION'],
});

const player = new Player(client, {
  ytdlOptions: {
    filter: 'audioonly',
    opusEncoded: 'true',
    quality: 'highestaudio',
    highWaterMark: 1 << 30,
  },
});

module.exports = {
  player,
};

// Dynamically add all commands in the "./commands" directory
const commands = [];
client.commands = new Collection();
const commandFiles = fs
    .readdirSync('./commands')
    .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
}

// Dynamically add all events in the "./events" directory
const clientEventFiles = fs
    .readdirSync('./events/client')
    .filter((file) => file.endsWith('.js'));

for (const file of clientEventFiles) {
  // console.log(file);
  const event = require(`./events/client/${file}`);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, commands));
  } else {
    client.on(event.name, (...args) => event.execute(...args, commands));
  }
}

// Dynamically add all events in the "./events" directory
const playerEventFiles = fs
    .readdirSync('./events/player')
    .filter((file) => file.endsWith('.js'));

for (const file of playerEventFiles) {
  const event = require(`./events/player/${file}`);

  if (event.once) {
    player.once(event.name, (...args) => event.execute(...args, commands));
  } else {
    player.on(event.name, (...args) => event.execute(...args, commands));
  }
}

const fileAgeMS = 86400000;
const checkMS = 10800000;

setInterval(function() {
  walkDir('./downloads/', function(filePath) {
    fs.stat(filePath, function(err, stat) {
      const now = new Date().getTime();
      const endTime = new Date(stat.mtime).getTime() + fileAgeMS;

      if (err) {
        return console.error(err);
      }

      if (now > endTime) {
        // console.log('DEL:', filePath);
        return fs.unlink(filePath, function(err) {
          if (err) return console.error(err);
        });
      }
    });
  });
}, checkMS);

/**
 *
 * @param {string} dir
 * @param {function} callback
 */
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// console.log(player.scanDeps());
main();
client.login(process.env.DISCORD_TOKEN);
