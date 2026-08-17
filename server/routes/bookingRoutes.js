import express from 'express';
import { confirmBookingPayment, createBooking, getOccupiedSeats } from '../controllers/bookingController.js';

const bookingRouter = express.Router();


bookingRouter.post('/create', createBooking);
bookingRouter.get('/confirm-payment', confirmBookingPayment);
bookingRouter.get('/seats/:showId', getOccupiedSeats);

export default bookingRouter;
