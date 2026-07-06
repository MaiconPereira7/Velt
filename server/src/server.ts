import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes     from './routes/auth.routes';
import cryptoRoutes   from './routes/crypto.routes';
import financeRoutes  from './routes/finance.routes';
import insightsRoutes from './routes/insights.routes';
import { errorHandler } from './utils/error.middleware';

const app = express();
const PORT = process.env['PORT'] ?? 3333;

// Suporta múltiplas origens separadas por vírgula (ex: domínio do Vercel +
// localhost em dev) — cada uma vira um item da lista que o cors() aceita.
const ALLOWED_ORIGINS = (process.env['CORS_ORIGIN'] ?? 'http://localhost:4200')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.use('/auth',         authRoutes);
app.use('/crypto',       cryptoRoutes);
app.use('/transactions', financeRoutes);
app.use('/insights',     insightsRoutes);

// Retrocompatibilidade com endpoint original
app.get('/bitcoin', (_req, res) => res.redirect('/crypto/bitcoin'));

app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
