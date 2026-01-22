const Task = require('../models/task');


exports.getUserTasks = async (req, res) => {
    try {
        const { status, priority, type } = req.query;
        
       
        let filter = { assignedTo: req.user._id };
        
     
        if (status && status !== 'all') {
            filter.status = status;
        }
      
        if (priority && priority !== 'all') {
            filter.priority = priority;
        }
        
     
        if (type === 'active') {
            filter.status = { $in: ['open', 'in-progress'] };
        } else if (type === 'completed') {
            filter.status = 'resolved';
        }
        
      
        const allUserTasks = await Task.find({ assignedTo: req.user._id });
        
       
        const totalTasks = allUserTasks.length;
        const openTasks = allUserTasks.filter(t => t.status === 'open').length;
        const inProgressTasks = allUserTasks.filter(t => t.status === 'in-progress').length;
        const resolvedTasks = allUserTasks.filter(t => t.status === 'resolved').length;
        const activeTasks = openTasks + inProgressTasks;
        
        
        const tasks = await Task.find(filter)
            .populate('project', 'projectName projectDescription')
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            statistics: {
                totalTasks,
                openTasks,
                inProgressTasks,
                resolvedTasks,
                activeTasks,
                completedTasks: resolvedTasks
            },
            filters: {
                status: status || 'all',
                priority: priority || 'all',
                type: type || 'all'
            },
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserDashboard = async (req, res) => {
    try {
      
        const allTasks = await Task.find({ assignedTo: req.user._id })
            .populate('project', 'projectName')
            .sort({ createdAt: -1 });
        
   
        const totalTasks = allTasks.length;
        const openTasks = allTasks.filter(t => t.status === 'open').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'in-progress').length;
        const resolvedTasks = allTasks.filter(t => t.status === 'resolved').length;
        

        const myTasks = allTasks.filter(t => t.status !== 'resolved');
        const completedTasks = allTasks.filter(t => t.status === 'resolved');
        
        res.status(200).json({
            success: true,
            statistics: {
                totalTasks,
                openTasks,
                inProgressTasks,
                resolvedTasks
            },
            myTasks: myTasks.map(task => ({
                _id: task._id,
                title: task.title,
                description: task.description,
                project: {
                    _id: task.project._id,
                    projectName: task.project.projectName
                },
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            })),
            completedTasks: completedTasks.map(task => ({
                _id: task._id,
                title: task.title,
                project: {
                    _id: task.project._id,
                    projectName: task.project.projectName
                },
                status: task.status,
                dueDate: task.dueDate,
                completedDate: task.updatedAt
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.updateTaskStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({ message: 'Please provide status' });
        }
        
       
        const task = await Task.findOne({ 
            _id: req.params.id, 
            assignedTo: req.user._id 
        });
        
        if (!task) {
            return res.status(404).json({ 
                message: 'Task not found or not assigned to you' 
            });
        }
        
        task.status = status;
        
       
        if (notes !== undefined) {
            task.notes = notes;
        }
        
        await task.save();
        
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
