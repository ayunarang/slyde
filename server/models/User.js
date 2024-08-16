const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    rooms: [
        {
            roomId: { type: String, required: true },
            chatWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}, 
            messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }] 
        }
    ],
    isOnline: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
