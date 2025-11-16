import 'dotenv/config';

export default {
  expo: {
    name: 'FitHealth',
    slug: 'fit-health',
    scheme: 'fit-health',
    android: {
      package: 'com.jakkaphat.fithealth',
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: 'fit-health' }], 
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ], 
      versionCode: 15,
      permissions: ['CAMERA'],                     
    },
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY,
       eas: {
        projectId: 'bbb89918-9e9d-4dae-acac-0c4c847be032',
      },
    },
  },
};
