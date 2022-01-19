import { SlashCommandBuilder } from '@discordjs/builders';
import { BaseCommandInteraction } from 'discord.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('startmeme')
    .setDescription('Pick a meme template and get started.'),
  async execute(interaction: BaseCommandInteraction) {
    console.log('here is the interaction the startmeme', interaction);

    interaction.reply({
      content: `Hi there,`,
      ephemeral: true,
    });
  },
  // put another async function for executing on a select interaction
};

export default command;
