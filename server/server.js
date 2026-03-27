const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

dotenv.config();

const app = express();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes')(supabase));
app.use('/api/scores', require('./routes/scoreRoutes')(supabase));
app.use('/api/draws', require('./routes/drawRoutes')(supabase));
app.use('/api/charities', require('./routes/charityRoutes')(supabase));
app.use('/api/payments', require('./routes/paymentRoutes')(supabase));
app.use('/api/admin', require('./routes/adminRoutes')(supabase));
app.use('/api/upload', require('./routes/uploadRoutes')(supabase));
app.use('/api/notifications', require('./routes/notificationRoutes')(supabase));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Client URL: ${process.env.CLIENT_URL}`);
});