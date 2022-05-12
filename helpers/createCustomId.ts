export const createCustomId = ({
  page,
  id,
  selectionId,
}: {
  page: number;
  id: string;
  selectionId?: string;
}) => {
  return JSON.stringify({ id, page, selectionId });
};
