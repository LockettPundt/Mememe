import axios from 'axios';
import { config } from 'dotenv';
import { stringify } from 'querystring';
import { getMemeList, Meme } from './getMemeList';
config();

const url = `https://api.imgflip.com/caption_image`;
const username = process.env.MEME_API_USERNAME;
const password = process.env.MEME_API_PASSWORD;

export const createMeme = async ({
  templateId,
  inputs,
}: {
  templateId: Meme[`id`];
  inputs: string[];
}): Promise<{ url: string; page_url: string } | null> => {
  const selection = (await getMemeList()).find(
    (meme) => meme.id === templateId
  );

  if (selection) {
    const params: Record<string, string | undefined> = {
      password,
      username,
      template_id: templateId,
    };

    inputs.forEach((input, index) => {
      params[`boxes[${index}][text]`] = input;
    });

    const result = await axios({
      url,
      method: 'post',
      params,
    });
    return result.data.data;
  }
  return null;
};
