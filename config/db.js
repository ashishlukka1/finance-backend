const mongoose = require('mongoose');

let cachedConnection = null;
let connectionPromise = null;

const connectDB = async () => {
  try {
    if (cachedConnection) {
      return cachedConnection;
    }

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not configured');
    }

    if (!connectionPromise) {
      connectionPromise = mongoose.connect(process.env.MONGO_URI)
        .then((mongooseInstance) => {
          cachedConnection = mongooseInstance;
          console.log('MongoDB Connected Successfully');
          return mongooseInstance;
        })
        .catch((error) => {
          connectionPromise = null;
          console.error('MongoDB Connection Error:', error.message);
          throw error;
        });
    }

    return connectionPromise;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    throw error;
  }
};

module.exports = connectDB;
