const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

// Register user (only works if you later add a DB)
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Since no DB yet, just return success
    res.status(201).json({ message: "User registered successfully!", email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user using demo credentials from .env
const loginUser = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Compare with demo credentials from .env
    const DEMO_EMAIL = userType === 'admin' ? process.env.DEMO_ADMIN_EMAIL : process.env.DEMO_STUDENT_EMAIL;
    const DEMO_PASSWORD = userType === 'admin' ? process.env.DEMO_ADMIN_PASSWORD : process.env.DEMO_STUDENT_PASSWORD;

    if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create a fake token for demo purposes
    const token = generateToken({ id: "demo-id", email });

    res.json({
      message: 'Login successful',
      token,
      user: { email, userType },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export at the bottom
module.exports = {
  registerUser,
  loginUser,
};
