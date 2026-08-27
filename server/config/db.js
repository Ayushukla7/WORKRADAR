const mongoose = require('mongoose');
const autoSeedIfEmpty = require('../utils/autoSeed');

/**
 * Connects to MongoDB database using Mongoose.
 * Attempts connection to local/cloud MongoDB URI.
 * If local MongoDB service is not running, spins up an In-Memory MongoDB Server automatically.
 * Automatically runs autoSeedIfEmpty() to guarantee demo accounts exist!
 */
const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workradar';
  
  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2500, // 2.5 second connection timeout fast fallback
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    await autoSeedIfEmpty();
  } catch (error) {
    console.warn(`[MongoDB Primary Connection Warning]: ${error.message}`);
    console.log('[MongoDB Fallback] Starting in-memory MongoDB Server for instant development...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      
      const conn = await mongoose.connect(memUri);
      console.log(`[MongoDB Memory Server] Connected successfully to in-memory database: ${conn.connection.host}`);
      await autoSeedIfEmpty();
    } catch (memError) {
      console.error(`[MongoDB Memory Server Error]: ${memError.message}`);
    }
  }
};

module.exports = connectDB;
