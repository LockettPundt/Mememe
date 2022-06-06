import discordModals, {
  Modal,
  ModalSubmitInteraction,
  showModal,
  TextInputComponent,
} from 'discord-modals';
import {
  Client,
  Collection,
  Intents,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
} from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import { createCustomId } from './helpers/createCustomId';
import { createMeme } from './helpers/createMeme';
import { getMemeList } from './helpers/getMemeList';
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

discordModals(client);

client.commands = new Collection();
const commandFiles = fs
  .readdirSync('./dist/commands')
  .filter((file) => file.endsWith('.js'));

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

  if (!command) {
    console.log(`No command found...`);
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

// Embed current selection
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isSelectMenu()) {
    return;
  }
  const { page } = JSON.parse(interaction.customId);

  const memeList = await getMemeList();
  const selectedValue = interaction.values[0];

  const selectedMeme = memeList.find((meme) => meme.id === selectedValue);

  if (!selectedMeme) {
    return await interaction.reply(
      'Hmmm, looks like your selection is busted. Try another.'
    );
  }

  const numberOftextFieldsForMeme: number = selectedMeme.box_count;

  const embed = new MessageEmbed({
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

  const selectRow = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId(
        createCustomId({
          id: `meme-select`,
          page,
        })
      )
      .setPlaceholder('None Selected')
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

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(
        createCustomId({
          selectionId: selectedMeme.id,
          id: `set-template`,
          page,
        })
      )
      .setLabel('Set Template Text')
      .setStyle('SUCCESS'),
    new MessageButton()
      .setCustomId(
        createCustomId({
          id: `previous`,
          page: page - 1,
        })
      )
      .setLabel('Previous 25 templates')
      .setStyle('SECONDARY')
      .setDisabled(!showBackButton),
    new MessageButton()
      .setCustomId(
        createCustomId({
          id: `next`,
          page: page + 1,
        })
      )
      .setLabel('Next 25 templates')
      .setStyle('PRIMARY')
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

// Meme pagination
client.on(`interactionCreate`, async (interaction) => {
  if (!interaction.isButton()) return;

  const { id, page } = JSON.parse(interaction.customId);

  if (![`next`, `previous`].includes(id)) return;
  const skip = 25 * page;

  const memeList = await getMemeList();
  const currentPageMemeList = memeList.slice(skip, skip + 25);

  const selectRow = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId(
        createCustomId({
          id: `meme-select`,
          page,
        })
      )
      .setPlaceholder('None Selected')
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

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(
        createCustomId({
          id: `previous`,
          page: page - 1,
        })
      )
      .setLabel('Previous 25 templates')
      .setStyle('SECONDARY')
      .setDisabled(!showBackButton),
    new MessageButton()
      .setCustomId(
        createCustomId({
          id: `next`,
          page: page + 1,
        })
      )
      .setLabel('Next 25 templates')
      .setStyle('PRIMARY')
      .setDisabled(!showNextButton)
  );

  await interaction.update({
    embeds: [],
    components: [selectRow, row],
  });
});

// Meme template text modal
client.on(`interactionCreate`, async (interaction) => {
  if (!interaction.isButton()) return;
  const { id, selectionId, page } = JSON.parse(interaction.customId);

  if (!id || id !== `set-template`) return;

  const memeList = await getMemeList();

  const selectedMeme = memeList.find((meme) => meme.id === selectionId);
  if (!selectedMeme) {
    return await interaction.reply(
      'Hmmm, looks like your selection is busted. Try another.'
    );
  }

  const numberOftextFieldsForMeme = selectedMeme.box_count;

  const modal = new Modal()
    .setCustomId(
      createCustomId({
        id: `modal`,
        selectionId: selectedMeme.id,
        page,
      })
    )
    .setTitle('Add your meme text')
    .addComponents(
      ...Array.from({ length: numberOftextFieldsForMeme }).map((_, i) =>
        new TextInputComponent()
          .setCustomId(`input-${i}`)
          .setLabel(`Text Box ${i + 1}`)
          .setStyle('SHORT')
          .setMinLength(1)
          .setMaxLength(100)
          .setDefaultValue('')
          .setRequired(true)
      )
    );

  showModal(modal, {
    interaction,
    client,
  });
});

client.on(`modalSubmit`, async (modal: ModalSubmitInteraction) => {
  // send stuff to api, await reply and then post picture.
  const { selectionId } = JSON.parse(modal.customId);
  const inputLength = modal.fields.length;
  const inputs: string[] = Array.from({ length: inputLength }).map((_, i) =>
    modal.getTextInputValue(`input-${i}`)
  );

  const createdMeme = await createMeme({ templateId: selectionId, inputs });
  console.log(createdMeme, { user: modal.user.username });

  if (createdMeme) {
    const embed = new MessageEmbed({
      image: {
        url: createdMeme.url,
      },
    })
      .setTitle(`Go see your meme!`)
      .setURL(createdMeme.page_url)
      .setDescription(
        `Nice work ${modal.user.username}! The world is now a better place.`
      );

    modal.update({
      content: null,
      embeds: [embed],
      components: [],
    });
  } else {
    console.log(`some kind of error handling...`);
  }
});

client.login(process.env.TOKEN);
