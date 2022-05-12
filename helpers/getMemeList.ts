import axios from 'axios';

const url = 'https://api.imgflip.com/get_memes';

export interface Meme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

export const getMemeList = async (): Promise<Meme[]> => {
  return (await axios.get(url))?.data?.data?.memes ?? [];
};
