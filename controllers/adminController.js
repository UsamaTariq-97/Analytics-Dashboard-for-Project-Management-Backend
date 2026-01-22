const User = require('../models/users');
const Project = require('../models/project');
const Task = require('../models/task');


exports.getAdminDashboard = async (req, res) => {
    try {
        
        const allUsers = await User.find();
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter(u => u.status === 'active').length;
        
       
        const allProjects = await Project.find();
        const totalProjects = allProjects.length;
        const activeProjects = allProjects.filter(p => p.projectStatus === 'active').length;
        
      
        const allTasks = await Task.find();
        const totalTasks = allTasks.length;
        const openTasks = allTasks.filter(t => t.status === 'open').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'in-progress').length;
        const resolvedTasks = allTasks.filter(t => t.status === 'resolved').length;
        
        
        const users = await User.find({ role: { $in: ['user', 'moderator'] } })
            .select('fullName email role status createdAt')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            statistics: {
                totalUsers,
                activeUsers,
                totalProjects,
                activeProjects,
                totalTasks,
                openTasks,
                inProgressTasks,
                resolvedTasks
            },
            users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['user', 'moderator'] } })
            .select('fullName email role status createdAt')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.suspendUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
 
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot suspend yourself' });
        }
        
       
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot suspend admin users' });
        }
        
        user.status = 'suspended';
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'User suspended successfully',
            data: user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.activateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.status = 'active';
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'User activated successfully',
            data: user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
   
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete yourself' });
        }
        
       
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin users' });
        }
        
        await user.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getAllProjects = async (req, res) => {
    try {
        const { status, search } = req.query;
        
        let filter = {};
        
       
        if (status && status !== 'all') {
            filter.projectStatus = status;
        }
        
        
        if (search) {
            filter.$or = [
                { projectName: { $regex: search, $options: 'i' } },
                { projectDescription: { $regex: search, $options: 'i' } }
            ];
        }
        
        const projects = await Project.find(filter)
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects.map(p => ({
                _id: p._id,
                projectName: p.projectName,
                projectDescription: p.projectDescription,
                projectStatus: p.projectStatus,
                manager: {
                    _id: p.createdBy._id,
                    fullName: p.createdBy.fullName,
                    email: p.createdBy.email
                },
                tasks: p.tasks,
                teamSize: p.teamSize,
                progress: p.progress,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getSystemAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }
        
      
        const allUsers = await User.find(dateFilter);
        const totalUsers = allUsers.length;
        const usersByRole = {
            admin: allUsers.filter(u => u.role === 'admin').length,
            moderator: allUsers.filter(u => u.role === 'moderator').length,
            user: allUsers.filter(u => u.role === 'user').length
        };
        
    
        const adminPercentage = totalUsers > 0 ? Math.round((usersByRole.admin / totalUsers) * 100) : 0;
        const moderatorPercentage = totalUsers > 0 ? Math.round((usersByRole.moderator / totalUsers) * 100) : 0;
        const userPercentage = totalUsers > 0 ? Math.round((usersByRole.user / totalUsers) * 100) : 0;
        
     
        const allProjects = await Project.find(dateFilter);
        const totalProjects = allProjects.length;
        const projectsByStatus = {
            active: allProjects.filter(p => p.projectStatus === 'active').length,
            completed: allProjects.filter(p => p.projectStatus === 'completed').length,
            pending: allProjects.filter(p => p.projectStatus === 'pending').length,
            'on-hold': allProjects.filter(p => p.projectStatus === 'on-hold').length
        };
        
 
        const activeProjectPercentage = totalProjects > 0 ? Math.round((projectsByStatus.active / totalProjects) * 100) : 0;
        const completedProjectPercentage = totalProjects > 0 ? Math.round((projectsByStatus.completed / totalProjects) * 100) : 0;
        
        
        const allTasks = await Task.find(dateFilter);
        const totalTasks = allTasks.length;
        const tasksByStatus = {
            open: allTasks.filter(t => t.status === 'open').length,
            'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
            resolved: allTasks.filter(t => t.status === 'resolved').length,
            completed: allTasks.filter(t => t.status === 'completed').length
        };
        
        const tasksByPriority = {
            high: allTasks.filter(t => t.priority === 'high').length,
            medium: allTasks.filter(t => t.priority === 'medium').length,
            low: allTasks.filter(t => t.priority === 'low').length,
            urgent: allTasks.filter(t => t.priority === 'urgent').length
        };
        
        
        const completedTasksCount = tasksByStatus.resolved + tasksByStatus.completed;
        const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
        
        res.status(200).json({
            success: true,
            dateRange: {
                startDate: startDate || null,
                endDate: endDate || null
            },
            statistics: {
                totalUsers,
                totalProjects,
                totalTasks,
                completionRate
            },
            usersByRole: {
                admin: {
                    count: usersByRole.admin,
                    percentage: adminPercentage
                },
                moderator: {
                    count: usersByRole.moderator,
                    percentage: moderatorPercentage
                },
                user: {
                    count: usersByRole.user,
                    percentage: userPercentage
                }
            },
            projectsByStatus: {
                active: {
                    count: projectsByStatus.active,
                    percentage: activeProjectPercentage
                },
                completed: {
                    count: projectsByStatus.completed,
                    percentage: completedProjectPercentage
                },
                pending: {
                    count: projectsByStatus.pending
                },
                onHold: {
                    count: projectsByStatus['on-hold']
                }
            },
            tasksByStatus,
            tasksByPriority
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
