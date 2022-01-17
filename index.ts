import { Client, Intents } from 'discord.js';
import { config } from 'dotenv';
config();
const client = new Client({
  intents: [
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
});

client.on(`ready`, () => {
  console.log(`Yay! You're logged in as ${client.user?.tag}...`);
});

client.on(`message`, async (msg) => {
  console.log(`here is the msg object\n\n`, msg);
  if (msg.author.bot) {
    return;
  } else {
    msg.reply(`Hi there ${msg.author.username}`);
  }
});

client.login(process.env.TOKEN);
