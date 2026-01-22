const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectName: {
        type: String,
        required: [true, 'Please add a project name'],
        trim: true
    },
    projectDescription: {
        type: String,
        required: [true, 'Please add a project description'],
        trim: true
    },
    projectStatus: {
        type: String,
        enum: ['pending', 'active', 'completed', 'on-hold'],
        default: 'pending',
        required: [true, 'Please add a project status']
    },
    projectStartDate: {
        type: Date,
        required: [true, 'Please add a start date']
    },
    projectEndDate: {
        type: Date,
        required: [true, 'Please add an end date']
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    tasks: {
        type: Number,
        default: 0,
        min: 0
    },
    teamSize: {
        type: Number,
        default: 0,
        min: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('project', projectSchema);
