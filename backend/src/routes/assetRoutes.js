const router = require('express').Router();
const { getAssets, getAssetById, createAsset, updateAsset, addMaintenance, bulkUpload } = require('../controllers/assetController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);
router.get('/', getAssets);
router.post('/bulk', roleGuard('ADMIN', 'TEAM_LEADER'), activityLogger('BULK_CREATE', 'Asset'), bulkUpload);
router.get('/:id', getAssetById);
router.post('/', roleGuard('ADMIN', 'TEAM_LEADER'), activityLogger('CREATE', 'Asset'), createAsset);
router.put('/:id', roleGuard('ADMIN', 'TEAM_LEADER'), activityLogger('UPDATE', 'Asset'), updateAsset);
router.post('/:id/maintenance', roleGuard('ADMIN', 'TEAM_LEADER', 'AGENT'), activityLogger('MAINTENANCE', 'Asset'), addMaintenance);

module.exports = router;
