const router = require('express').Router();
const { getComments, createComment } = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/:ticketId', getComments);
router.post('/:ticketId', createComment);

module.exports = router;
