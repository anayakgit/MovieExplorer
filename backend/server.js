const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.disable('x-powered-by'); // Hide Express version information
const port = 3000;
require('dotenv').config();

// Middleware
const corsOptions = {
 origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
 credentials: true,
 optionsSuccessStatus: 200
};
app.use(cors(corsOptions)); // Secure CORS configuration
app.use(express.json()); // Parse JSON bodies

// MongoDB Atlas connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
 .then(() => console.log('Connected to MongoDB Atlas'))
 .catch(err => console.error('MongoDB connection error:', err));

// Define Movie schema
const movieSchema = new mongoose.Schema({
 userId: { type: String, required: true },
 movieId: { type: Number, required: true },
 title: { type: String, required: true },
 releaseDate: { type: String },
 posterPath: { type: String },
});
const Movie = mongoose.model('Movie', movieSchema);

// API Endpoints
// Save a liked movie
app.post('/api/movies/like', async (req, res) => {
 try {
   const { userId, movieId, title, releaseDate, posterPath } = req.body;
   const movie = new Movie({ userId, movieId, title, releaseDate, posterPath });
   await movie.save();
   res.status(201).json({ message: 'Movie liked successfully' });
 } catch (error) {
   console.error('Error saving liked movie:', error);
   res.status(500).json({ error: 'Failed to save liked movie' });
 }
});

// Get all liked movies for a user
app.get('/api/movies/liked/:userId', async (req, res) => {
 try {
   const { userId } = req.params;
   const movies = await Movie.find({ userId });
   res.json(movies);
 } catch (error) {
   console.error('Error fetching liked movies:', error);
   res.status(500).json({ error: 'Failed to fetch liked movies' });
 }
});

// Start server
app.listen(port, () => {
 console.log(`Server running at http://localhost:${port}`);
});