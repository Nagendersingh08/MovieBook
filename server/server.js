import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = 3000;

await connectDB()

// Stripe Webhooks Route
app.use('/api/stripe', express.raw({type: 'application/json'}), stripeWebhooks)

// Middleware
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())


// API Routes
app.get('/', (req, res)=> res.send('Server is Live!'))
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)

app.use((error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    const message = error?.message || "Internal server error";
    const isAuthError =
        message.toLowerCase().includes('clerk') ||
        message.toLowerCase().includes('auth') ||
        message.toLowerCase().includes('token') ||
        message.toLowerCase().includes('unauthorized');

    const statusCode = error?.status || error?.statusCode || (isAuthError ? 401 : 500);

    res.status(statusCode).json({
        success: false,
        message: isAuthError ? "not authorized" : message
    });
});

app.listen(port, ()=> console.log(`Server listening at http://localhost:${port}`));
