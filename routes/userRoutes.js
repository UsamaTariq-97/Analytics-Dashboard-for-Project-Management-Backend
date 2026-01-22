const express = require('express');
const router = express.Router();
const {
    getUserTasks,
    getUserDashboard,
    updateTaskStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect);


router.get('/tasks', authorize('user'), getUserTasks);


router.get('/dashboard', authorize('user'), getUserDashboard);


router.put('/tasks/:id/status', authorize('user'), updateTaskStatus);

module.exports = router;
