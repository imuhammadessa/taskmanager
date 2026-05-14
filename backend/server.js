require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
// Import Routes
const auth = require('./routes/auth.route');
const user = require('./routes/user.route');
// const tasks = require('./routes/tasks.route');
// const report = require('./routes/report.route');

const app = express();

// Middleware to handle CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

// Connect to Database
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * Routes
 */

app.use('/api/auth', auth);
app.use('/api/users', user);
// app.use('/api/tasks', tasks.routes);
// app.use('/api/report', report.routes);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
