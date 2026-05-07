const router = require('express').Router();
const { getNotifications, markAsRead, markAllRead, getUnreadCount } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markAsRead);

module.exports = router;
