const bcrypt = require("bcrypt");
const User = require("../models/User.js");


exports.register = async (req, res) => {
    try {

        const {
            username,
            email,
            password,
            confirmPassword,
        } = req.body

        console.log('username:', username);
        console.log('email:', email);
        console.log('password:', password);
        console.log('confirmPassword:', confirmPassword);

        if (!username ||!email || !password || !confirmPassword) {
            return res.status(403).json({
                success: false,
                message: 'All fields are mandetory'
            })
        }

        if (password !== confirmPassword) {
            return res.status(401).json({
                succes: false,
                message: 'Confirm Password and Password does not not match'
            })
        }

        const hashPass = await bcrypt.hash(password, 10);

        const user = await User.create({
            username: username,
            email: email,
            password: hashPass,
            isOnline:false,
        })

        await user.save();
    
        res.status(200).json({
            success: true,
            message: 'User signed up successfully',
            user: user,
        })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'user can not be registered'
        })
    }
}



exports.login = async (req, res) => {
    try {
        console.log(req.body);
        const { username, password } = req.body;
        console.log('username:', username);
        console.log('password:', password);

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please fill all details'
            })
        }

        let user = await User.findOne({ username })
        console.log(user);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'user not found'
            })
        }

        const userId= user._id;

        if (await bcrypt.compare(password, user.password)) {
 
            res.status(200).json({
                success: true,
                message: 'User logged in successfully',
                userId: userId,

            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: "password incorrect"
            })
        }
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'login failure'
        })
    }
}