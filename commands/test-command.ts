import { SlashCommandBuilder } from '@discordjs/builders';
import {
  BaseCommandInteraction,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
} from 'discord.js';
import axios from 'axios';

const command = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('This is a test command'),
  async execute(interaction: BaseCommandInteraction) {
    // create list of memes (25 limit)
    const getMemeList =
      (await axios.get('https://api.imgflip.com/get_memes'))?.data?.data
        ?.memes ?? [];
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('meme-select')
        .setPlaceholder('Select Your Meme Template')
        .addOptions(
          // Create Meme type
          getMemeList.slice(0, 25).map((x: any) => ({
            label: x.name,
            description: `${x.name} meme.`,
            value: x.id,
          }))
        )
    );

    // ship list as dropdown to user.

    await interaction.reply({
      content: 'Select your meme template...',
      components: [row],
      ephemeral: true,
    });
  },
};

export default command;

// const [value] = interaction.options.data.values();

// console.log(value);

// const selectedMeme = getMemeList.find((meme: any) => meme.id === value);

// if (!selectedMeme) {
//   return await interaction.reply(
//     'Hmmm, looks like your selection is busted. Try another.'
//   );
// }

// const numberOftextFieldsForMeme: number = selectedMeme.box_count;

// const embed = new MessageEmbed({
//   image: {
//     url: selectedMeme.url,
//   },
//   fields: Array.from({ length: numberOftextFieldsForMeme }).map((_, i) => ({
//     inline: false,
//     name: `Text Field ${i + 1}`,
//     value: 'Lorem Ipsum...',
//   })),
// })
//   .setTitle(selectedMeme.name)
//   .setDescription(
//     `Fill out the ${numberOftextFieldsForMeme} text field${
//       numberOftextFieldsForMeme > 1 ? 's' : ''
//     }...`
//   );

//   if (interaction.customId === 'meme-select') {
//     const reply = await interaction.update({
//       embeds: [embed],
//       fetchReply: true,
//     });
//   }
// }

// if (commandName === 'user') {
// const getMemeList = await axios.get('https://api.imgflip.com/get_memes');
