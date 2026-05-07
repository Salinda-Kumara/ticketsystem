const router = require('express').Router();
const { getActivityLogs, getLoginHistory } = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/logs', roleGuard('ADMIN'), getActivityLogs);
router.get('/login-history', roleGuard('ADMIN'), getLoginHistory);

module.exports = router;
