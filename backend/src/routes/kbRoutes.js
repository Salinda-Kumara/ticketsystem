const router = require('express').Router();
const { getArticles, getArticleById, createArticle, updateArticle, deleteArticle } = require('../controllers/kbController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', getArticles);
router.get('/:id', getArticleById);
router.post('/', roleGuard('ADMIN', 'TEAM_LEADER', 'AGENT'), createArticle);
router.put('/:id', roleGuard('ADMIN', 'TEAM_LEADER', 'AGENT'), updateArticle);
router.delete('/:id', roleGuard('ADMIN', 'TEAM_LEADER'), deleteArticle);

module.exports = router;
