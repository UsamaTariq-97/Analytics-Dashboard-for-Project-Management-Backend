const express = require('express');
const router = express.Router();
const {
    getAdminDashboard,
    getAllUsers,
    suspendUser,
    activateUser,
    deleteUser,
    getAllProjects,
    getSystemAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect);
router.use(authorize('admin'));


router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/activate', activateUser);
router.delete('/users/:id', deleteUser);


router.get('/projects', getAllProjects);


router.get('/analytics', getSystemAnalytics);

module.exports = router;
