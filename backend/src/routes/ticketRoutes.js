const router = require('express').Router();
const {
  getTickets, getTicketById, createTicket, updateTicket,
  updateTicketStatus, assignTicket, uploadAttachments
} = require('../controllers/ticketController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { activityLogger } = require('../middleware/activityLogger');

router.use(authenticate);

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', activityLogger('CREATE', 'Ticket'), createTicket);
router.put('/:id', roleGuard('ADMIN', 'TEAM_LEADER', 'AGENT'), activityLogger('UPDATE', 'Ticket'), updateTicket);
router.put('/:id/status', activityLogger('UPDATE_STATUS', 'Ticket'), updateTicketStatus);
router.put('/:id/assign', roleGuard('ADMIN', 'TEAM_LEADER'), activityLogger('ASSIGN', 'Ticket'), assignTicket);
router.post('/:id/attachments', activityLogger('UPLOAD', 'Attachment'), uploadAttachments);

module.exports = router;
