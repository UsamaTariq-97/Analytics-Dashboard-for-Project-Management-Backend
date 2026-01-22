const express = require('express');
const router = express.Router();
const {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    assignTask
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect);


router.post('/', authorize('moderator', 'admin'), createTask);


router.get('/', getAllTasks);


router.route('/:id')
    .get(getTaskById)
    .put(updateTask)
    .delete(deleteTask);


router.put('/:id/assign', assignTask);

module.exports = router;
