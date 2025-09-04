const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register new user
const register = async (req, res) => {
  try {
    console.log('Registration request received:', {
      body: req.body,
      headers: req.headers
    });

    const { username, email, password, role = 'user' } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.username);
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);


    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();
    console.log('User saved successfully:', newUser.username);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Registration successful for:', newUser.username);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during registration' 
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login' 
    });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching users' 
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching profile' 
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;

    // Check if username or email already exists
    if (username || email) {
      const existingUser = await User.findOne({
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ],
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username or email already exists' 
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while updating profile' 
    });
  }
};

// Seed users (for development)
const seedUsers = async (req, res) => {
  try {
    // Check if users already exist
    const existingUsers = await User.find();
    if (existingUsers.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Users already seeded' 
      });
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      },
      {
        username: 'user1',
        email: 'user1@example.com',
        password: hashedPassword,
        role: 'user'
      },
      {
        username: 'user2',
        email: 'user2@example.com',
        password: hashedPassword,
        role: 'user'
      },
      {
        username: 'user3',
        email: 'user3@example.com',
        password: hashedPassword,
        role: 'user'
      }
    ];

    await User.insertMany(users);
    
    res.json({ 
      success: true, 
      message: 'Users seeded successfully',
      count: users.length
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while seeding users' 
    });
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  getProfile,
  updateProfile,
  seedUsers
};


