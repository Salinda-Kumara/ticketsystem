const router = require('express').Router();
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.get('/', getDepartments);
router.post('/', roleGuard('ADMIN'), activityLogger('CREATE', 'Department'), createDepartment);
router.put('/:id', roleGuard('ADMIN'), activityLogger('UPDATE', 'Department'), updateDepartment);
router.delete('/:id', roleGuard('ADMIN'), activityLogger('DELETE', 'Department'), deleteDepartment);

module.exports = router;
