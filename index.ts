import { Client, Intents, Collection } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
config();
class CustomClient extends Client {
  commands?: Collection<unknown, any>;
}

const client: CustomClient = new Client({
  intents: [
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
});

client.commands = new Collection();
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client?.commands?.set(command.default.data.name, command.default);
}

client.on('ready', () => {
  console.log(`You're logged in as ${client.user?.tag}...`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  const command = client.commands?.get(interaction.commandName);

  console.log('here is the command being sent', command);

  if (!command) {
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);
