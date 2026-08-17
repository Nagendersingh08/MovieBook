import mongoose from 'mongoose';

// Use reliable DNS servers for MongoDB Atlas SRV lookup
// import dns from 'node:dns';
// dns.setServers(['1.1.1.1', '8.8.8.8']); 

const connectDB = async () =>{
    try {
        mongoose.connection.on('connected', ()=> console.log('Database connected'));
        // console.log("URI:", process.env.MONGODB_URI);

        await mongoose.connect(`${process.env.MONGODB_URI}/moviebook`)
        // await mongoose.connect(process.env.MONGODB_URI)
    } catch (error) {
        console.log(error.message);
        
    }
}

export default connectDB;