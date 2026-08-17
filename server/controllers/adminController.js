import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js"
import Show from "../models/Show.js";
import User from "../models/User.js";


// API to check if user is admin
export const isAdmin = async (req, res) =>{
    res.json({success: true, isAdmin: true})
}

// API to get dashboard data
export const getDashboardData = async (req, res) =>{
    try {
        const bookings = await Booking.find({isPaid: true});
        const activeShows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie');

        const totalUser = await User.countDocuments();

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking)=> acc + booking.amount, 0),
            activeShows,
            totalUser
        }

        res.json({success: true, dashboardData})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all shows
export const getAllShows = async (req, res) =>{
    try {
        const shows = await Show.find({showDateTime: { $gte: new Date() }}).populate('movie').sort({ showDateTime: 1 })
        res.json({success: true, shows})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all bookings
export const getAllBookings = async (req, res) =>{
    try {
        const bookings = await Booking.find({}).populate({
            path: "show",
            populate: {path: "movie"}
        }).sort({ createdAt: -1 })

        const userIds = [...new Set(bookings
            .map((booking) => booking.user?.toString?.() || booking.user)
            .filter(Boolean))];

        const existingUsers = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = new Map(existingUsers.map((user) => [user._id, user]));

        const bookingsWithUsers = await Promise.all(bookings.map(async (booking) => {
            const bookingObject = booking.toObject();
            const userId = bookingObject.user?.toString?.() || bookingObject.user;

            let user = userMap.get(userId) || null;

            if (!user && userId) {
                try {
                    const clerkUser = await clerkClient.users.getUser(userId);
                    user = {
                        _id: clerkUser.id,
                        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Unknown User",
                        email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
                        image: clerkUser.imageUrl || "",
                    };
                } catch (error) {
                    console.error(error);
                }
            }

            return {
                ...bookingObject,
                user,
            };
        }));

        res.json({success: true, bookings: bookingsWithUsers })
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}
