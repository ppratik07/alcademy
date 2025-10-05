import express from 'express';
import authRoutes from './routes/authRoutes';
const app = express();


app.use("/api/auth",authRoutes);

const PORT = process.env.PORT ||5000;


app.use(express.json());
