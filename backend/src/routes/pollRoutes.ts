import { Router } from 'express';
import pollController from '../controllers/pollController';

const router = Router();

// Create new poll
router.post('/', pollController.createPoll);

// Get poll by host code
router.get('/:hostCode/host', pollController.getPollByHostCode);

// Get poll by participant code
router.get('/:participantCode/join', pollController.getPollByParticipantCode);

// Update poll status
router.put('/:hostCode/status', pollController.updatePollStatus);

// Submit responses
router.post('/:participantCode/responses', pollController.submitResponses);

// Get poll results
router.get('/:hostCode/results', pollController.getPollResults);

export default router;
