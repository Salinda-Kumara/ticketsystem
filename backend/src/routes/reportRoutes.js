const router = require('express').Router();
const { getMonthlyReport, exportTickets } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/monthly', roleGuard('ADMIN', 'TEAM_LEADER'), getMonthlyReport);
router.get('/export', roleGuard('ADMIN', 'TEAM_LEADER', 'AGENT'), exportTickets);

module.exports = router;
