const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.disable('x-powered-by');

const port = process.env.PORT || 3000;

// Log incoming requests (helpful for debugging on Render)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Adjust CORS for your deployed frontend domain
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:5500', 
    'http://localhost:5500',
    'https://movieexplorer-uetc.onrender.com/'  // <-- Add your frontend deployed domain here
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Movie Schema
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

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server on Render port or 3000 locally
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
