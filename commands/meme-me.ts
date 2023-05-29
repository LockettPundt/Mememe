import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ButtonStyle,
} from 'discord.js';
import { getMemeList } from '../helpers/getMemeList';
import { createCustomId } from '../helpers/createCustomId';

const command = {
  data: new SlashCommandBuilder().setName(`mememe`).setDescription(`Mememe...`),
  async execute(interaction: CommandInteraction) {
    // * Create list of memes (25 limit)
    const memeList = await getMemeList();
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(
          createCustomId({
            page: 0,
            id: `meme-select`,
          })
        )
        .setPlaceholder(`None Selected`)
        .addOptions(
          memeList.slice(0, 25).map((meme) => ({
            label: meme.name,
            description: `${meme.name} meme.`,
            value: meme.id,
          }))
        )
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(
          createCustomId({
            page: 1,
            id: `next`,
          })
        )
        .setLabel(`Next 25 templates`)
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: `Select your meme template...`,
      components: [selectRow, row],
      ephemeral: true,
    });
  },
};

export default command;
