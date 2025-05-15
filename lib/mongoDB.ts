// mongodb.js

import { MongoClient } from 'mongodb'

const uri: string = process.env.MONGODB_URI??""


/**
 * 
 * @returns Db object from mongoDB
 */

export const connectToCluster = async () => {
    let mongoClient;
    try {
        mongoClient = new MongoClient(uri);
        console.log('Connecting to MongoDB cluster...');
        await mongoClient.connect();
        console.log('Successfully connected to MongoDB!');
        const db = mongoClient.db();
        return db;
    } catch (error) {
        console.error('Connection to MongoDB failed!', error);
        process.exit();
    }
}

