import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { config } from './config'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { apiLimiter } from './middleware/rateLimit'

// Import routes
import authRoutes from './routes/auth'

const app = express()

// Middleware
app.use(helmet()) // Security headers
app.use(cors({ origin: config.corsOrigin })) // CORS
app.use(compression()) // Response compression
app.use(express.json()) // JSON body parser
app.use(express.urlencoded({ extended: true })) // URL-encoded body parser
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined')) // Logging

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  })
})

// API routes (with rate limiting)
app.use('/api/auth', authRoutes)

// 404 handler
app.use(notFoundHandler)

// Error handler
app.use(errorHandler)

// Start server
const PORT = config.port

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 Environment: ${config.nodeEnv}`)
  console.log(`🌐 CORS origin: ${config.corsOrigin}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled Rejection:', error)
  process.exit(1)
})

export default app
