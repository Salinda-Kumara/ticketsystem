const router = require('express').Router();
const { getArticles, getArticleById, createArticle, updateArticle, deleteArticle } = require('../controllers/kbController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.get('/', getArticles);
router.get('/:id', getArticleById);
router.post('/', roleGuard('ADMIN', 'TEAM_LEADER', 'AGENT'), activityLogger('CREATE', 'KBArticle'), createArticle);
router.put('/:id', roleGuard('ADMIN', 'TEAM_LEADER', 'AGENT'), activityLogger('UPDATE', 'KBArticle'), updateArticle);
router.delete('/:id', roleGuard('ADMIN', 'TEAM_LEADER'), activityLogger('DELETE', 'KBArticle'), deleteArticle);

module.exports = router;
