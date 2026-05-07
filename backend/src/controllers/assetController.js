const prisma = require('../utils/prisma');
const { apiResponse, paginationMeta } = require('../utils/helpers');

const getAssets = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { assignedTo: { firstName: { contains: search, mode: 'insensitive' } } },
        { assignedTo: { lastName: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } }
      }),
      prisma.asset.count({ where })
    ]);

    return apiResponse(res, 200, { assets, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch assets.');
  }
};

const getAssetById = async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        maintenance: { orderBy: { performedAt: 'desc' } }
      }
    });
    if (!asset) return apiResponse(res, 404, null, 'Asset not found.');
    return apiResponse(res, 200, asset);
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch asset.');
  }
};

const createAsset = async (req, res) => {
  try {
    const asset = await prisma.asset.create({ data: req.body });
    return apiResponse(res, 201, asset, 'Asset created.');
  } catch (error) {
    if (error.code === 'P2002') return apiResponse(res, 409, null, 'Asset tag already exists.');
    return apiResponse(res, 500, null, 'Failed to create asset.');
  }
};

const updateAsset = async (req, res) => {
  try {
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: req.body,
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } }
    });
    return apiResponse(res, 200, asset, 'Asset updated.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to update asset.');
  }
};

const addMaintenance = async (req, res) => {
  try {
    const log = await prisma.maintenanceLog.create({
      data: { ...req.body, assetId: req.params.id }
    });
    return apiResponse(res, 201, log, 'Maintenance log added.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to add maintenance log.');
  }
};

const bulkUpload = async (req, res) => {
  try {
    const { assets } = req.body;
    if (!assets || !Array.isArray(assets)) return apiResponse(res, 400, null, 'Invalid assets data.');
    
    // Ensure all required fields exist
    const validAssets = assets.filter(a => a.assetTag && a.name && a.type).map(a => ({
      assetTag: a.assetTag,
      name: a.name,
      type: a.type,
      serialNumber: a.serialNumber || null,
      manufacturer: a.manufacturer || null,
      model: a.model || null,
      status: a.status || 'AVAILABLE',
      notes: a.notes || null
    }));

    const result = await prisma.asset.createMany({
      data: validAssets,
      skipDuplicates: true
    });

    return apiResponse(res, 201, result, `Successfully imported ${result.count} assets.`);
  } catch (error) {
    console.error('Bulk upload error:', error);
    return apiResponse(res, 500, null, 'Failed to import assets.');
  }
};

module.exports = { getAssets, getAssetById, createAsset, updateAsset, addMaintenance, bulkUpload };
