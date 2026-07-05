import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes     from './routes/auth.routes';
import cryptoRoutes   from './routes/crypto.routes';
import financeRoutes  from './routes/finance.routes';
import insightsRoutes from './routes/insights.routes';

const app = express();
const PORT = process.env['PORT'] ?? 3333;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.use('/auth',         authRoutes);
app.use('/crypto',       cryptoRoutes);
app.use('/transactions', financeRoutes);
app.use('/insights',     insightsRoutes);

// Retrocompatibilidade com endpoint original
app.get('/bitcoin', (_req, res) => res.redirect('/crypto/bitcoin'));

app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
