const { query } = require("express");
const User = require("../models/User.js");
const Message = require('../models/Message.js');
const crypto = require('crypto')



exports.search = async (req, res) => {
    try {
        const { searchContact } = req.body;

        if (searchContact === null || searchContact === undefined) {
            return res.status(400).json({
                success: true,
                message: "search term empty"
            })
        }

        const sanitizedSearchTerm = searchContact.replace(/[^a-zA-Z0-9]/g, '');

        const regex = new RegExp(sanitizedSearchTerm, 'i');
        const contacts = await User.find(
            { $or: [{ username: regex, email: regex }] }

        )

        return res.status(200).json({
            contacts: contacts,
            success: true,
            message: "search completed"
        })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'search failure'
        })
    }
}

exports.createRoom = async (req, res) => {
    try {
        const { userId, selectedChatId } = req.body;
        console.log("given data", userId, selectedChatId);

        if (userId === null || selectedChatId === null) {
            return res.status(400).json({
                success: true,
                message: "userId or selectedchatId empty"
            })
        }

        let user = await User.findOne({ _id: userId })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'user not found'
            })
        }

        const existingRoom = user.rooms.find(room => room.chatWith.toString() === selectedChatId);
        if (existingRoom) {
            return res.status(201).json({
                success: true,
                message: 'Room already exists',
                roomId: existingRoom.roomId
            });
        }

        const roomId = crypto.createHash('sha256').update(`${userId}-${selectedChatId}`).digest('hex');
        // console.log("room id made")

        user.rooms.push({ roomId, chatWith: selectedChatId });
        await user.save();

        console.log(`Generated room ID: ${roomId}`);

        return res.status(200).json({
            success: true,
            message: 'Room created successfully',
            roomId: roomId
        });
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'room create failure'
        })
    }
}

exports.getChatlist = async (req, res) => {

    try {
        const userId = req.query.userId;
        // console.log(userId)

        const user = await User.findById(userId)
            .populate({
                path: 'rooms.chatWith',
                select: 'username email'
            })
            .populate({
                path: 'rooms.messages',
                select: 'sender content createdAt',
                populate: {
                    path: 'sender',
                    select: 'username email'
                }
            });

        console.log(user)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'user not found'
            })
        }

        const chatlist = user.rooms;
        console.log(chatlist)

        if (!chatlist || chatlist.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Room list empty.',
                chatlist: chatlist
            });
        }

        // console.log(`Chatlist of user: ${chatlist}`);

        // const userIds = chatlist.map(chat => chat.chatWith);
        // const usersInChatlist = await User.find({ _id: { $in: userIds } })
        // console.log(usersInChatlist);


        return res.status(200).json({
            success: true,
            message: 'Chatlist fetched successfully',
            chatlist: chatlist
        })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'chatlist fetch failure'
        })
    }
}


exports.getChatMessages = async (req, res) => {

    try {
        const { userId, roomId } = req.query;
        console.log(userId, roomId);


        const user = await User.findById(userId)
            .populate({
                path: 'rooms.chatWith',
                select: 'username email'
            })
            .populate({
                path: 'rooms.messages',
                select: 'sender content createdAt',
                populate: {
                    path: 'sender',
                    select: 'username email'
                }
            });


        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'user not found'
            })
        }

        const room = user.rooms.find(room => room.roomId === roomId);
        console.log("get room messages api call output", room)

        if (!room) {
            return res.status(401).json({
                success: false,
                message: 'Room not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Room fetched successfully',
            room: room
        })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'room fetch failure'
        })
    }
}

exports.saveChatInDB = async (req, res) => {
    try {
        const { data } = req.body;
        const content = data.content;
        const sender = data.sender;
        const receiver = data.receiver;

        console.log(content);
        console.log(sender);
        console.log(receiver);

        const user = await User.findOne({ _id: sender });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Sender not found',
            });
        }

        const receiverUser = await User.findOne({ _id: receiver });
        if (!receiverUser) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found',
            });
        }

        const SenderDBRoom = user.rooms.find(room => room.chatWith.toString() === receiver);
        if (!SenderDBRoom) {
            return res.status(404).json({
                success: false,
                message: 'Room does not exist',
            });
        }
        const roomId = SenderDBRoom.roomId;
        console.log("room id in sender db:", roomId)

        let receiverDBRoom = receiverUser.rooms.find(room => room.roomId === roomId);
        if (!receiverDBRoom) {
            receiverUser.rooms.push({ roomId, chatWith: sender });
            console.log("new room made for receiver for saving sender's messages");
            await receiverUser.save();
            receiverDBRoom = receiverUser.rooms.find(room => room.roomId === roomId);
        }

        const usermessages = new Message({ content, sender, receiver });
        console.log("new message field made in message database", usermessages);

        SenderDBRoom.messages.push(usermessages._id);
        receiverDBRoom.messages.push(usermessages._id);

        console.log("object id added to user db for message db");

        await usermessages.save();
        await user.save();
        await receiverUser.save();

        console.log(usermessages);

        return res.status(200).json({
            success: true,
            message: 'Chat saved successfully',
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: 'Chat save failure',
        });
    }
};

