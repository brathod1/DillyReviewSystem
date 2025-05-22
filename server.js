const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const path = require('path');

mongoose.connect(process.env.MONGODB_URI)



// --- Mongoose Review Model ---
const reviewSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 3 },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  feedback: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);

// --- MongoDB Connection ---
mongoose.connect('mongodb+srv://bhishmadev2003:bhishmadev2003@cluster0.hr5q1lz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Serve Customer Frontend ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// --- Password Protection for Staff Routes ---
app.use(['/staff', '/staff-reviews'], (req, res, next) => {
  const auth = {login: 'staff', password: 'password'}; // <-- Set your own credentials

  // Parse login from headers
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  // Verify login and password are set and correct
  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }

  // Access denied
  res.set('WWW-Authenticate', 'Basic realm="Staff Area"');
  res.status(401).send('Authentication required.');
});


// --- Serve Staff Dashboard ---
app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff.html'));
});

// --- Review Submission Endpoint (for 1-3 stars) ---
app.post(
  '/review',
  [
    body('rating').isInt({ min: 1, max: 3 }).withMessage('Rating must be 1, 2, or 3 stars'),
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('feedback').notEmpty().withMessage('Comments are required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { rating, name, phone, feedback } = req.body;
      const review = new Review({ rating, name, phone, feedback });
      await review.save();
      res.json({ message: 'Review received successfully!' });
    } catch (err) {
      res.status(500).json({ errors: [{ msg: 'Database error' }] });
    }
  }
);

// --- Get All Low-Rated Reviews (for staff dashboard) ---
app.get('/staff-reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ errors: [{ msg: 'Database error' }] });
  }
});

// --- 404 Handler (Optional) ---
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
