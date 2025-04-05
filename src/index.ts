import 'dotenv/config'
import express ,{ Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { connectDb } from './db/db'
import Logger from './utils/logger'


const app : Application = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(helmet())
app.use(morgan('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// limit api rate 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
})
app.use(limiter)


// server health check
app.get('/health', (req:Request,res: Response) => {
  res.status(200).json({ status: 'ok' });
});


// server start
connectDb()
  .then(() => {
    app.listen(PORT, () => {
      Logger.info(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    Logger.error('Failed to start server:', error);
    process.exit(1); // Exit with failure code
  });


// routes



