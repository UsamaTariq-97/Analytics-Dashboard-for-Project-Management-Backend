const Task = require('../models/task');
const Project = require('../models/project');


exports.createTask = async (req, res) => {
    try {
        const { title, description, project, status, priority, dueDate } = req.body;

        
        if (!title || !description || !project || !status || !priority || !dueDate) {
            return res.status(400).json({ message: 'Please provide all required fields including due date' });
        }

       
        const projectExists = await Project.findById(project);
        if (!projectExists) {
            return res.status(404).json({ message: 'Project not found' });
        }

      
        if (projectExists.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to create tasks for this project' });
        }

  
        const task = await Task.create({
            title,
            description,
            project,
            status,
            priority,
            dueDate: new Date(dueDate),
            createdBy: req.user._id
        });

        
        await Project.findByIdAndUpdate(project, {
            $inc: { tasks: 1 }
        });

       
        await task.populate('project', 'projectName');
        await task.populate('createdBy', 'fullName email');

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllTasks = async (req, res) => {
    try {
    
        const tasks = await Task.find({ createdBy: req.user._id })
            .populate('project', 'projectName')
            .populate('assignedTo', 'fullName email')
            .sort({ createdAt: -1 });

    
        const totalTasks = tasks.length;
        const openTasks = tasks.filter(t => t.status === 'open').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
        const resolvedTasks = tasks.filter(t => t.status === 'resolved').length;

        res.status(200).json({
            success: true,
            statistics: {
                totalTasks,
                openTasks,
                inProgressTasks,
                resolvedTasks
            },
            data: tasks
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('project', 'projectName projectDescription')
            .populate('createdBy', 'fullName email')
            .populate('assignedTo', 'fullName email');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to access this task' });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

      
        if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        
        const oldStatus = task.status;
        const newStatus = req.body.status;

        task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('project', 'projectName')
         .populate('assignedTo', 'fullName email');

     
        if (oldStatus !== newStatus && (newStatus === 'resolved' || oldStatus === 'resolved')) {
            await updateProjectProgress(task.project._id);
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

       
        if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }

        const projectId = task.project;

        await task.deleteOne();

    
        await Project.findByIdAndUpdate(projectId, {
            $inc: { tasks: -1 }
        });

  
        await updateProjectProgress(projectId);

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.assignTask = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'Please provide user ID' });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

       
        if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to assign this task' });
        }

        
        if (task.assignedTo) {
            return res.status(400).json({ 
                message: 'This task has already been assigned to a user. Please unassign first before reassigning.' 
            });
        }

        task.assignedTo = userId;
        await task.save();

      
        await Project.findByIdAndUpdate(task.project, {
            $inc: { teamSize: 1 }
        });

        await task.populate('assignedTo', 'fullName email');
        await task.populate('project', 'projectName');

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


async function updateProjectProgress(projectId) {
    try {
        const tasks = await Task.find({ project: projectId });
        const totalTasks = tasks.length;

        if (totalTasks === 0) {
            await Project.findByIdAndUpdate(projectId, { progress: 0 });
            return;
        }

        const resolvedTasks = tasks.filter(t => t.status === 'resolved').length;
        const progress = Math.round((resolvedTasks / totalTasks) * 100);

        await Project.findByIdAndUpdate(projectId, { progress });
    } catch (error) {
        console.error('Error updating project progress:', error);
    }
}
