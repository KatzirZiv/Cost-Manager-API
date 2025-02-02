import express from 'express';
import mongoose from 'mongoose';
import costRoutes from './routes/costRoutes.js';
import userRoutes from './routes/userRoutes.js';

const URL = "mongodb+srv://katzirziv:CrCSJlK46P4jJl3g@cluster0.pgid0.mongodb.net/";
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(URL).then(() => console.log("Connected to Database")).catch((error)=> console.log(`Error: ${error}`));

// Define API routes
app.use('/api', costRoutes);
app.use('/api', userRoutes);

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`Running on port ${PORT}`));
}

export default app;