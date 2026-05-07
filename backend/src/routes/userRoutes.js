const router = require('express').Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, getAgents } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);

// Agent list - must be before /:id route
router.get('/agents/list', getAgents);

router.get('/', roleGuard('ADMIN', 'TEAM_LEADER'), getUsers);
router.get('/:id', roleGuard('ADMIN', 'TEAM_LEADER'), getUserById);
router.post('/', roleGuard('ADMIN'), createUser);
router.put('/:id', roleGuard('ADMIN'), updateUser);
router.delete('/:id', roleGuard('ADMIN'), deleteUser);

module.exports = router;
