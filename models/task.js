const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a task description'],
        trim: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: [true, 'Please assign task to a project']
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'completed'],
        default: 'open',
        required: [true, 'Please add a task status']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        required: [true, 'Please add a task priority']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    dueDate: {
        type: Date,
        required: [true, 'Please add a due date']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('task', taskSchema);
