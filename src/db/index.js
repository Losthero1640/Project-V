// always wrap ur data in a try catch block
//db is always on another continent i.e. it takes time to connect so use async await

import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n Connected to the database DB host:
            ${connectionInstance}`);
    }
    catch(error){
        console.error('Error connecting to the database:', error);
        throw error; // rethrow the error to be handled by the caller
        process.exit(1); //if conn fail exit
    }
}

export default connectDB;