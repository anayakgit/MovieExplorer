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
  console.log('Incoming request:', req.method, req.url);
  next();
});

// CORS setup
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema and model
const movieSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  movieId: { type: Number, required: true },
  title: { type: String, required: true },
  releaseDate: { type: String },
  posterPath: { type: String },
});
const Movie = mongoose.model('Movie', movieSchema);

// API endpoints
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

// Serve frontend index.html for client-side routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
