import dotenv from 'dotenv';
dotenv.config({
  path: "./.env",
});
import {app} from './app.js';
import connectDB from './db/index.js';

const PORT = process.env.PORT || 3000;

connectDB()
.then(() => {
    app.listen(3000, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to the database:', error);
    process.exit(1); // Exit the process if the database connection fails
});