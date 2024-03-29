import {
  Client,
  Collection,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Events,
  ButtonStyle,
  TextInputStyle,
  CommandInteraction,
} from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import { createCustomId } from './helpers/createCustomId';
import { createMeme } from './helpers/createMeme';
import { getMemeList } from './helpers/getMemeList';
import {
  ButtonBuilder,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
} from '@discordjs/builders';
config();

class CustomClient extends Client {
  commands?: Collection<
    string,
    { data: SlashCommandBuilder; execute: (interaction: CommandInteraction) => Promise<void> }
  >;
}

const client: CustomClient = new CustomClient({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./dist/commands').filter((file) => file.endsWith(`.js`));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

client.once(Events.ClientReady, () => {
  console.log(`You're logged in as ${client.user?.tag}...`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  const command = client.commands?.get(interaction.commandName);

  if (!command) {
    console.log(`No command found...`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: `There was an error while executing this command!`,
      ephemeral: true,
    });
  }
});

// * Embed current selection
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) {
    return;
  }

  const { page } = JSON.parse(interaction.customId);

  const memeList = await getMemeList();
  const selectedValue = interaction.values[0];

  const selectedMeme = memeList.find((meme) => meme.id === selectedValue);

  if (!selectedMeme) {
    interaction.reply(`Hmmm, looks like your selection is busted. Try another.`);
    return;
  }

  const numberOftextFieldsForMeme: number = selectedMeme.box_count;

  const embed = new EmbedBuilder({
    image: {
      url: selectedMeme.url,
    },
  })
    .setTitle(selectedMeme.name)
    .setDescription(
      `Click 'Set Template Text' to update the  ${numberOftextFieldsForMeme} text field${
        numberOftextFieldsForMeme > 1 ? 's' : ''
      }.`
    );

  const skip = 25 * page;
  const currentPageMemeList = memeList.slice(skip, skip + 25);

  const { id } = JSON.parse(interaction.customId);

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(
        createCustomId({
          id: `meme-select`,
          page,
        })
      )
      .setPlaceholder(`None Selected`)
      .addOptions(
        currentPageMemeList.map((meme) => ({
          label: meme.name,
          description: `${meme.name} meme.`,
          value: meme.id,
        }))
      )
  );

  const showBackButton = page !== 0;
  const showNextButton = memeList.slice(skip + 25).length > 0;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        createCustomId({
          selectionId: selectedMeme.id,
          id: `set-template`,
          page,
        })
      )
      .setLabel(`Set Template Text`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(
        createCustomId({
          id: `previous`,
          page: page - 1,
        })
      )
      .setLabel(`Previous 25 templates`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!showBackButton),
    new ButtonBuilder()
      .setCustomId(
        createCustomId({
          id: `next`,
          page: page + 1,
        })
      )
      .setLabel(`Next 25 templates`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!showNextButton)
  );

  if (id === `meme-select`) {
    interaction.update({
      embeds: [embed],
      components: [selectRow, row],
    });
  }
});

// TODO: get all meme ids from cache or just query for now. or in JSON?
// TODO: send some kind of data object in interaction?

// * Meme pagination
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const { id, page } = JSON.parse(interaction.customId);

  if (![`next`, `previous`].includes(id)) return;
  const skip = 25 * page;

  const memeList = await getMemeList();
  const currentPageMemeList = memeList.slice(skip, skip + 25);

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(
        createCustomId({
          id: `meme-select`,
          page,
        })
      )
      .setPlaceholder(`None Selected`)
      .addOptions(
        currentPageMemeList.map((meme) => ({
          label: meme.name,
          description: `${meme.name} meme.`,
          value: meme.id,
        }))
      )
  );

  const showBackButton = page !== 0;
  const showNextButton = memeList.slice(skip + 25).length > 0;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        createCustomId({
          id: `previous`,
          page: page - 1,
        })
      )
      .setLabel(`Previous 25 templates`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!showBackButton),
    new ButtonBuilder()
      .setCustomId(
        createCustomId({
          id: `next`,
          page: page + 1,
        })
      )
      .setLabel(`Next 25 templates`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!showNextButton)
  );

  await interaction.update({
    embeds: [],
    components: [selectRow, row],
  });
});

// * Meme template text modal
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) {
    return;
  }
  const { id, selectionId, page } = JSON.parse(interaction.customId);

  if (!id || id !== `set-template`) return;

  const memeList = await getMemeList();

  const selectedMeme = memeList.find((meme) => meme.id === selectionId);

  if (!selectedMeme) {
    interaction.reply('Hmmm, looks like your selection is busted. Try another.');
    return;
  }

  const numberOftextFieldsForMeme = selectedMeme.box_count;

  const modal = new ModalBuilder()
    .setCustomId(
      createCustomId({
        id: `modal`,
        selectionId: selectedMeme.id,
        page,
      })
    )
    .setTitle(`Add your meme text`)
    .addComponents(
      ...Array.from({ length: numberOftextFieldsForMeme }).map((_, index) =>
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(`input-${index}`)
            .setLabel(`Text Box ${index + 1}`)
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(100)
            .setRequired(true)
        )
      )
    );

  interaction.showModal(modal);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) {
    return;
  }

  // * Send inputs to api, await reply and then post picture.
  const { selectionId } = JSON.parse(interaction.customId);
  const inputLength = interaction.fields.fields.size;

  const inputs: string[] = Array.from({ length: inputLength }).map((_, i) =>
    interaction.fields.getTextInputValue(`input-${i}`)
  );

  const createdMeme = await createMeme({ templateId: selectionId, inputs });
  console.log(createdMeme, { user: interaction.user.username });

  if (createdMeme) {
    const embed = new EmbedBuilder({
      image: {
        url: createdMeme.url,
      },
    })
      .setTitle(`Go see your meme!`)
      .setURL(createdMeme.page_url)
      .setDescription(`Nice work ${interaction.user.username}! The world is now a better place.`);

    interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } else {
    interaction.reply(`There was an unknown error...`);
  }
});

client.login(process.env.TOKEN);
