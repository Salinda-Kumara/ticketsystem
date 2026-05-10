const router = require('express').Router();
const { getComments, createComment } = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.get('/:ticketId', getComments);
router.post('/:ticketId', activityLogger('CREATE', 'Comment'), createComment);

module.exports = router;
