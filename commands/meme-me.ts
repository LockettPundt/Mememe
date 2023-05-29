import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
} from 'discord.js';
import { getMemeList } from '../helpers/getMemeList';
import { createCustomId } from '../helpers/createCustomId';

const command = {
  data: new SlashCommandBuilder()
    .setName('mememe')
    .setDefaultPermission(true)
    .setDescription('Mememe...'),
  async execute(interaction: CommandInteraction) {
    // * Create list of memes (25 limit)
    const memeList = await getMemeList();
    const selectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(
          createCustomId({
            page: 0,
            id: `meme-select`,
          })
        )
        .setPlaceholder('None Selected')
        .addOptions(
          memeList.slice(0, 25).map((meme) => ({
            label: meme.name,
            description: `${meme.name} meme.`,
            value: meme.id,
          }))
        )
    );

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId(
          createCustomId({
            page: 1,
            id: `next`,
          })
        )
        .setLabel('Next 25 templates')
        .setStyle('PRIMARY')
    );

    await interaction.reply({
      content: 'Select your meme template...',
      components: [selectRow, row],
      ephemeral: true,
    });
  },
};

export default command;
