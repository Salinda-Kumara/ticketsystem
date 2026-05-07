const router = require('express').Router();
const {
  getTickets, getTicketById, createTicket, updateTicket,
  updateTicketStatus, assignTicket, uploadAttachments
} = require('../controllers/ticketController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.put('/:id', roleGuard('ADMIN', 'TEAM_LEADER', 'AGENT'), updateTicket);
router.put('/:id/status', updateTicketStatus);
router.put('/:id/assign', roleGuard('ADMIN', 'TEAM_LEADER'), assignTicket);
router.post('/:id/attachments', uploadAttachments);

module.exports = router;
