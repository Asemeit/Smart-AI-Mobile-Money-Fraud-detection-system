import mongoose from 'mongoose';

export let dbConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('MONGODB_URI not set — running without database');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    dbConnected = true;
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    dbConnected = false;
    console.error('\n--- MongoDB connection failed ---');
    console.error(err.message);
    console.error('\nFix in Atlas (2 minutes):');
    console.error('1. Left menu → Network Access → Add IP Address');
    console.error('2. Choose "Allow Access from Anywhere" (0.0.0.0/0) for dev');
    console.error('3. Database Access → confirm user + password match backend/.env');
    console.error('4. Save .env and restart npm run dev\n');
    console.warn('Server will start WITHOUT database until this is fixed.\n');
    return false;
  }
}
