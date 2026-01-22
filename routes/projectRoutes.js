const express = require('express');
const router = express.Router();
const {
    createProject,
    getMyProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectsList,
    getDashboard,
    getTeamPerformance,
    getAnalytics
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect);


router.post('/', authorize('moderator', 'admin'), createProject);


router.get('/dashboard', authorize('moderator', 'admin'), getDashboard);


router.get('/team-performance', authorize('moderator', 'admin'), getTeamPerformance);


router.get('/analytics', authorize('moderator', 'admin'), getAnalytics);


router.get('/list', getProjectsList);

router.get('/', getMyProjects);


router.route('/:id')
    .get(getProjectById)
    .put(updateProject)
    .delete(deleteProject);

module.exports = router;
