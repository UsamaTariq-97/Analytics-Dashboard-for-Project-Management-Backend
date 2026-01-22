const Project = require('../models/project');
const Task = require('../models/task');
const User = require('../models/users');


exports.createProject = async (req, res) => {
    try {
        const { projectName, projectDescription, projectStatus, projectStartDate, projectEndDate } = req.body;

     
        if (!projectName || !projectDescription || !projectStatus || !projectStartDate || !projectEndDate) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

     
        const startDate = new Date(projectStartDate);
        const endDate = new Date(projectEndDate);

        if (endDate <= startDate) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        
        const project = await Project.create({
            projectName,
            projectDescription,
            projectStatus,
            projectStartDate: startDate,
            projectEndDate: endDate,
            createdBy: req.user._id  
        });

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getMyProjects = async (req, res) => {
    try {
       
        const projects = await Project.find({ createdBy: req.user._id })
            .sort({ createdAt: -1 });

       
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.projectStatus === 'active').length;
        const completedProjects = projects.filter(p => p.projectStatus === 'completed').length;

        res.status(200).json({
            success: true,
            statistics: {
                totalProjects,
                activeProjects,
                completedProjects
            },
            data: projects
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('createdBy', 'fullName email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

       
        if (project.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to access this project' });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

       
        if (project.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this project' });
        }

      
        if (req.body.projectStartDate && req.body.projectEndDate) {
            const startDate = new Date(req.body.projectStartDate);
            const endDate = new Date(req.body.projectEndDate);

            if (endDate <= startDate) {
                return res.status(400).json({ message: 'End date must be after start date' });
            }
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

       
        if (project.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this project' });
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getProjectsList = async (req, res) => {
    try {
        
        const projects = await Project.find({ createdBy: req.user._id })
            .select('projectName _id')
            .sort({ projectName: 1 });

        res.status(200).json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getDashboard = async (req, res) => {
    try {
        
        const projects = await Project.find({ createdBy: req.user._id });
        const projectIds = projects.map(p => p._id);

       
        const tasks = await Task.find({ project: { $in: projectIds } });

      
        const assignedUserIds = [...new Set(tasks
            .filter(t => t.assignedTo)
            .map(t => t.assignedTo.toString())
        )];

  
        const myProjects = projects.length;
        const activeProjects = projects.filter(p => p.projectStatus === 'active').length;
        const completedProjects = projects.filter(p => p.projectStatus === 'completed').length;
        const teamMembers = assignedUserIds.length;

        const totalTasks = tasks.length;
        const openTasks = tasks.filter(t => t.status === 'open').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
        const resolvedTasks = tasks.filter(t => t.status === 'resolved').length;

        res.status(200).json({
            success: true,
            statistics: {
                myProjects,
                activeProjects,
                completedProjects,
                teamMembers,
                totalTasks,
                openTasks,
                inProgressTasks,
                resolvedTasks
            },
            projects: projects.map(p => ({
                _id: p._id,
                projectName: p.projectName,
                projectStatus: p.projectStatus,
                progress: p.progress,
                tasks: p.tasks,
                teamSize: p.teamSize
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getTeamPerformance = async (req, res) => {
    try {
       
        const projects = await Project.find({ createdBy: req.user._id });
        const projectIds = projects.map(p => p._id);

   
        const tasks = await Task.find({ project: { $in: projectIds } })
            .populate('assignedTo', 'fullName email');

   
        const userTaskMap = {};

        tasks.forEach(task => {
            if (task.assignedTo) {
                const userId = task.assignedTo._id.toString();
                
                if (!userTaskMap[userId]) {
                    userTaskMap[userId] = {
                        userId: task.assignedTo._id,
                        fullName: task.assignedTo.fullName,
                        email: task.assignedTo.email,
                        tasksAssigned: 0,
                        tasksCompleted: 0,
                        efficiency: 0
                    };
                }

                userTaskMap[userId].tasksAssigned++;
                
                if (task.status === 'resolved') {
                    userTaskMap[userId].tasksCompleted++;
                }
            }
        });

    
        const teamPerformance = Object.values(userTaskMap).map(user => {
            user.efficiency = user.tasksAssigned > 0 
                ? Math.round((user.tasksCompleted / user.tasksAssigned) * 100) 
                : 0;
            return user;
        });

        teamPerformance.sort((a, b) => b.efficiency - a.efficiency);

        res.status(200).json({
            success: true,
            data: teamPerformance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getAnalytics = async (req, res) => {
    try {
        const { projectId } = req.query;
        
    
        let projectFilter = { createdBy: req.user._id };
        
        
        if (projectId) {
            projectFilter._id = projectId;
            
          
            const project = await Project.findOne(projectFilter);
            if (!project) {
                return res.status(404).json({ 
                    message: 'Project not found or you do not have access to it' 
                });
            }
        }
        
      
        const projects = await Project.find(projectFilter);
        const projectIds = projects.map(p => p._id);
        
        
        const tasks = await Task.find({ project: { $in: projectIds } });
        
    
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.projectStatus === 'active').length;
        
   
        const assignedUserIds = [...new Set(tasks
            .filter(t => t.assignedTo)
            .map(t => t.assignedTo.toString())
        )];
        const teamMembers = assignedUserIds.length;
        

        const totalTasks = tasks.length;
        const openTasks = tasks.filter(t => t.status === 'open').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
        const resolvedTasks = tasks.filter(t => t.status === 'resolved').length;
        
  
        const openPercentage = totalTasks > 0 ? Math.round((openTasks / totalTasks) * 100) : 0;
        const inProgressPercentage = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
        const resolvedPercentage = totalTasks > 0 ? Math.round((resolvedTasks / totalTasks) * 100) : 0;
        
        res.status(200).json({
            success: true,
            projectFilter: projectId ? 'single' : 'all',
            statistics: {
                totalProjects,
                activeProjects,
                totalTasks,
                teamMembers
            },
            taskStatusDistribution: {
                open: {
                    count: openTasks,
                    percentage: openPercentage
                },
                inProgress: {
                    count: inProgressTasks,
                    percentage: inProgressPercentage
                },
                resolved: {
                    count: resolvedTasks,
                    percentage: resolvedPercentage
                }
            },
            taskDistribution: {
                open: openTasks,
                inProgress: inProgressTasks,
                resolved: resolvedTasks
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
