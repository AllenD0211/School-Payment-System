require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Student = require('./models/studentModel');
const Parent = require('./models/parentModel');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('connected');
    const u = await User.create({ email: 'check2@example.com', password: 'x', userType: 'student' });
    const s = await Student.create({ userId: u._id, studentId: 'X2', firstName: 'A', lastName: 'B', gender: 'Male', birthdate: new Date(), gradeSection: 'G1' });
    console.log('created', u, s);
    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
}

run();
