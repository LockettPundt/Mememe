import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { config } from 'dotenv';
import fs from 'fs';
config();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.ts'));

const commands = getCommandsFromFiles(commandFiles);

if (TOKEN && CLIENT_ID && GUILD_ID) {
  const rest = new REST({ version: '9' }).setToken(TOKEN);
  (async () => {
    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  })();
}

function getCommandsFromFiles(commandFiles: string[]) {
  const commands = [];
  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    commands.push(command.default.data.toJSON());
  }
  return commands;
}
