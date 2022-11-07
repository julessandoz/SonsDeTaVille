try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch {
    // Ignore missing dotenv
  }
  
  export const databaseUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/sonsDeTaVille';
  export const port = process.env.PORT || '3000';
  export const jwtSecret = process.env.JWT_SECRET || 'secret'; //IT IS NOT A GOOD IDEA TO STORE YOUR SECRET IN THE CODE! INPUT YOUR OWN SECRET IN THE .env FILE IN THE ROOT DIRECTORY INSTEAD!
  export const bcryptFactor = 10;

