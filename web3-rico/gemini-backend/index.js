import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Gunakan port 3001 jika PORT tidak diatur

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Gemini Backend is running!');
});

// Anda bisa menambahkan rute Gemini API di sini jika diperlukan di masa mendatang
// Contoh: app.post('/gemini-proxy', async (req, res) => { ... });

app.listen(PORT, () => {
  console.log(`🚀 Gemini Backend berjalan di http://localhost:${PORT}`);
});
