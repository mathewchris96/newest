// password_manager_backend/app.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const bodyParser = require('body-parser');

const User = require('./models/userModel');
const EmailPassword = require('./models/emailPasswordModel');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
mongoose.connect(process.env.DB_CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Could not connect to MongoDB...', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const newUser = await new User({
      googleId: profile.id,
      email: profile.emails[0].value
    }).save();
    done(null, newUser);
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/dashboard');
  });

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) return res.status(400).send('User already registered.');

  user = new User({ email, password });
  await user.save();

  res.status(201).send('User registered successfully.');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send('Invalid email or password.');

  const validPassword = await user.isValidPassword(password);
  if (!validPassword) return res.status(400).send('Invalid email or password.');

  // Assuming login success
  res.send('Logged in successfully.');
});

app.get('/dashboard', (req, res) => {
  if (!req.user) return res.status(401).send('Access denied. Please login to continue.');
  res.send('Welcome to your dashboard.');
});

// CRUD operations for email-password pairs
app.post('/save', async (req, res) => {
  const { email, encryptedPassword } = req.body;
  if (!req.user) return res.status(401).send('Unauthorized.');

  const emailPassword = new EmailPassword({
    user: req.user._id,
    email,
    encryptedPassword
  });
  await emailPassword.save();

  res.status(201).send('Credentials saved successfully.');
});

app.get('/credentials', async (req, res) => {
  if (!req.user) return res.status(401).send('Unauthorized.');

  const credentials = await EmailPassword.find({ user: req.user._id });
  res.send(credentials);
});

app.delete('/delete/:id', async (req, res) => {
  if (!req.user) return res.status(401).send('Unauthorized.');

  await EmailPassword.findByIdAndRemove(req.params.id);
  res.send('Credential deleted successfully.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```