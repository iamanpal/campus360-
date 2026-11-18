const express = require('express');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Initialize Express App
const app = express();

// Connect to MongoDB
connectDB();

// Middleware: Body Parser (supporting assignment photo uploads)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Middleware: Serve Static Files (Public Site & Dashboards)
const fs = require('fs');
const rootLogo = path.join(__dirname, 'logo.png');
if (fs.existsSync(rootLogo)) {
  const publicDir = path.join(__dirname, 'public');
  const publicImagesDir = path.join(publicDir, 'images');
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
  }
  try {
    fs.copyFileSync(rootLogo, path.join(publicDir, 'logo.png'));
    fs.copyFileSync(rootLogo, path.join(publicImagesDir, 'logo.png'));
  } catch (e) {}
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Register API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Fallback Route for Root Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Campus 360 Server running on http://localhost:${PORT}`);
});
