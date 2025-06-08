const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.disable('x-powered-by');

const port = process.env.PORT || 3000;

// Log all requests (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS setup — allow localhost and deployed frontend
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://movieexplorer-uetc.onrender.com'  // deployed frontend URL (NO trailing slash)
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Parse JSON body
app.use(express.json());

// Serve static frontend files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Movie schema & model
const movieSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  movieId: { type: Number, required: true },
  title: { type: String, required: true },
  releaseDate: { type: String },
  posterPath: { type: String },
});
const Movie = mongoose.model('Movie', movieSchema);

// API routes
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

// Fallback to serve frontend index.html for any other route (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
