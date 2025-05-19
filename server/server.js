const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Express App
const app = express();

// CORS configuration
const allowedOrigins = [
  'chrome-extension://bjccmeidglkajpnaikmmobokhppahlja', // Allow your extension
  'http://localhost:3000' // Allow your local development server
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Mongoose Schema for Notes
const NoteSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Note = mongoose.model('Note', NoteSchema);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/notes')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// API endpoint to create a new note
app.post('/api/notes', (req, res) => {
  const newNote = new Note({
    userId: req.body.userId,
    title: req.body.title,
    content: req.body.content
  });

  newNote.save()
    .then(note => res.json(note))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Start the server
const PORT = process.env.PORT || 5001; // Changed port to 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));