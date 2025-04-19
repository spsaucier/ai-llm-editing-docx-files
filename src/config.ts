import { config as loadEnv } from 'dotenv';

// Load environment variables
loadEnv();

interface Config {
  openai: {
    apiKey: string;
  };
}

export const config: Config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
};

// Validate required config
if (!config.openai.apiKey) {
  throw new Error('OPENAI_API_KEY is required');
}
