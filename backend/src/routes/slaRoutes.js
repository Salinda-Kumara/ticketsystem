const router = require('express').Router();
const { getSLARules, createSLARule, updateSLARule, deleteSLARule } = require('../controllers/slaController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.get('/', getSLARules);
router.post('/', roleGuard('ADMIN'), activityLogger('CREATE', 'SLARule'), createSLARule);
router.put('/:id', roleGuard('ADMIN'), activityLogger('UPDATE', 'SLARule'), updateSLARule);
router.delete('/:id', roleGuard('ADMIN'), activityLogger('DELETE', 'SLARule'), deleteSLARule);

module.exports = router;
