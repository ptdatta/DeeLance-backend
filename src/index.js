//=============================To allow specific origins =====================//
// require('dotenv').config({ path: '.env' });
// const express = require('express');
// const mongoose = require('mongoose');
// const http = require('http');
// const cors = require('cors');
// const path = require('path');
// const cookieParser = require('cookie-parser');
// const { join } = require('path');
// const { Server } = require('socket.io');
// const router = require('./router/routes');

// const app = express();
// const server = http.createServer(app);

// // Middleware
// app.use(cookieParser());

// app.use(express.json());

// const allowedOrigins = [
//   'http://localhost:3000',
//   'https://2b38-45-113-159-251.ngrok-free.app',
//   'https://freelance-api.deelance.com',
//   'https://freelance.deelance.com',
//   // Add more allowed origins if necessary
// ];

// // Function to check if origin is allowed
// const checkOrigin = (origin, callback) => {
//   if (!origin) {
//     // Allow requests with no origin (like Postman or mobile apps)
//     return callback(null, true);
//   }

//   const trimmedOrigin = origin.replace(/\/$/, ''); // Remove trailing slash
//   if (allowedOrigins.includes(trimmedOrigin)) {
//     return callback(null, true);
//   }
//   console.error(`Blocked by CORS: ${origin}`);
//   return callback(new Error('Not allowed by CORS'));
// };

// // CORS setup for Express
// app.use(
//   cors({
//     origin: checkOrigin,
//     methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//     exposedHeaders: [
//       'Content-Disposition',
//       'X-Auth-Token',
//       'Authorization',
//       'Set-Cookie',
//     ],
//   }),
// );
// // Serve static files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.get('/', (req, res) => {
//   res.sendFile(join(__dirname, 'index.html'));
// });

// // Socket.io setup with CORS
// const io = new Server(server, {
//   cors: {
//     origin: checkOrigin,
//     methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//   },
// });

// io.on('connection', socket => {
//   console.log('A user connected');

//   // Handle chat message event
//   socket.on('chat message', msg => {
//     console.log(`Message: ${msg}`);
//   });

//   // Handle disconnect event
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });

// //==================production url======================//
// mongoose
//   .connect(process.env.MONGODB_URI_second, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverSelectionTimeoutMS: 30000,
//   })
//   .then(() => {
//     console.log(
//       'MongoDB connected successfully',
//       process.env.MONGODB_URI_second,
//     );
//   })
//   .catch(err => {
//     console.error('Error connecting to MongoDB:', err);
//   });

// app.set('io', io);
// app.use('/', router);

// // Start the server
// server.listen(4000, () => {
//   console.log('Server running at http://localhost:4000');
// });

//=========================To allow all origins for testing and development purposes===================//

require('dotenv').config({ path: '.env' });
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { join } = require('path');
const { Server } = require('socket.io');
const router = require('./router/routes');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cookieParser());
app.use(express.json());

// CORS setup for Express
app.use(
  cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'options'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: [
      'Content-Disposition',
      'X-Auth-Token',
      'Authorization',
      'Set-Cookie',
    ],
  }),
);
//app.options('*', cors());
// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

io.on('connection', socket => {
  console.log('A user connected');

  // Handle chat message event
  socket.on('chat message', msg => {
    console.log(`Message: ${msg}`);
  });

  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

//==================production url======================//
mongoose
  .connect(process.env.MONGODB_URI_second, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log(
      'MongoDB connected successfully',
      process.env.MONGODB_URI_second,
    );
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

app.set('io', io);
app.use('/', router);

// Start the server
server.listen(4000, () => {
  console.log('Server running at http://localhost:4000');
});
