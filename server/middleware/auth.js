import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next)=>{
    try {
        const auth = req.auth();
        const userId = auth?.userId;

        if(!userId){
            return res.status(401).json({ success: false, message: "Please login to continue" });
        }

        const user = await clerkClient.users.getUser(userId)

        if(user.privateMetadata?.role !== 'admin'){
            return res.status(403).json({success: false, message: "not authorized"})
        }

        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ success: false, message: "not authorized" });
    }
}
