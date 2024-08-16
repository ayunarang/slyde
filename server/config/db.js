
const mongoose =require('mongoose');


const mongoDb=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database working successfully');
       
      } catch (error) {
        console.error('Error connecting to the database:', error.message);
      }
}

module.exports=mongoDb;