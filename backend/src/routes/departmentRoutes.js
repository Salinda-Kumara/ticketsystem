const router = require('express').Router();
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', getDepartments);
router.post('/', roleGuard('ADMIN'), createDepartment);
router.put('/:id', roleGuard('ADMIN'), updateDepartment);
router.delete('/:id', roleGuard('ADMIN'), deleteDepartment);

module.exports = router;
