const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student',
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['paid', 'pending'],
    required: true 
  },
  type: { 
    type: String, 
    required: true 
  },
  dueDate: { 
    type: Date, 
    required: true 
  },
  receiptId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Receipt'
  },
  description: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Fee', feeSchema);