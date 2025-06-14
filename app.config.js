import 'dotenv/config';

export default {
  expo: {
    name: 'FitHealth',
    slug: 'fit-health',
    scheme: 'fit-health',
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY,
    },
  },
};
