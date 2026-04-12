export const mongoDbConfig = () => {
  const uri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/soul_card_db';

  return {
    uri,
  };
};
