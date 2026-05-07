const router = require('express').Router();
const { getSLARules, createSLARule, updateSLARule, deleteSLARule } = require('../controllers/slaController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', getSLARules);
router.post('/', roleGuard('ADMIN'), createSLARule);
router.put('/:id', roleGuard('ADMIN'), updateSLARule);
router.delete('/:id', roleGuard('ADMIN'), deleteSLARule);

module.exports = router;
