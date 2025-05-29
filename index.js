const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: 'https://bank-fronted.vercel.app', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
// app.use(cors())
app.use(express.json());

app.use('/api', authRoutes);

app.get('/', (req, res) => {
  res.send(' Server is running...');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
