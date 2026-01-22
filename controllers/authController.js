const user = require('../models/users');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
}

exports.registerUser = async (req, res) => {
    const { fullName, email, password, role } = req.body;   
    try {
        const existingUser = await user.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }   
        const newUser = await user.create({
            fullName,
            email,
            password,
            role
        });   
        const token = generateToken(newUser._id);
        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
try {
    const existingUser = await user.findOne({ email }).select('+password');
    if (!existingUser) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    
   
    if (existingUser.status === 'suspended') {
        return res.status(403).json({ message: 'Your account has been suspended by the admin' });
    }
    
    const isMatch = await existingUser.matchPassword(password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(existingUser._id);
    res.status(200).json({
        _id: existingUser._id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        role: existingUser.role,
        status: existingUser.status,
        token
    });
} catch (error) {
    res.status(500).json({ message: 'Server error' });
}
}


exports.getUsers = async (req, res) => {
    try {
        
        const users = await user.find({ role: 'user' })
            .select('fullName email _id')
            .sort({ fullName: 1 });

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}