const router = require('express').Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', getCategories);
router.post('/', roleGuard('ADMIN'), createCategory);
router.put('/:id', roleGuard('ADMIN'), updateCategory);
router.delete('/:id', roleGuard('ADMIN'), deleteCategory);

module.exports = router;
