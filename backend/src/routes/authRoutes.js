const router = require('express').Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.post('/register', activityLogger('REGISTER', 'User'), register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, activityLogger('UPDATE', 'Profile'), updateProfile);
router.put('/change-password', authenticate, activityLogger('UPDATE', 'Password'), changePassword);

module.exports = router;
