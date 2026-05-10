const router = require('express').Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.get('/', getCategories);
router.post('/', roleGuard('ADMIN'), activityLogger('CREATE', 'Category'), createCategory);
router.put('/:id', roleGuard('ADMIN'), activityLogger('UPDATE', 'Category'), updateCategory);
router.delete('/:id', roleGuard('ADMIN'), activityLogger('DELETE', 'Category'), deleteCategory);

module.exports = router;
