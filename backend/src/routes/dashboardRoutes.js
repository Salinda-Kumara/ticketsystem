const router = require('express').Router();
const { getStats } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/stats', getStats);

module.exports = router;
