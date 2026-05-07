const router = require('express').Router();
const { getAssets, getAssetById, createAsset, updateAsset, addMaintenance, bulkUpload } = require('../controllers/assetController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', getAssets);
router.post('/bulk', roleGuard('ADMIN', 'TEAM_LEADER'), bulkUpload);
router.get('/:id', getAssetById);
router.post('/', roleGuard('ADMIN', 'TEAM_LEADER'), createAsset);
router.put('/:id', roleGuard('ADMIN', 'TEAM_LEADER'), updateAsset);
router.post('/:id/maintenance', roleGuard('ADMIN', 'TEAM_LEADER', 'AGENT'), addMaintenance);

module.exports = router;
