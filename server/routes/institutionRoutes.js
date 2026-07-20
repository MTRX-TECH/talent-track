const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const institutionController = require('../controllers/institutionController');

router.use(authMiddleware);

router.get('/', roleMiddleware(['superadmin']), institutionController.getInstitutions);
router.post('/', roleMiddleware(['superadmin']), institutionController.createInstitution);
router.get('/:id', institutionController.getInstitutionDetails);
router.put('/:id', roleMiddleware(['superadmin', 'admin']), institutionController.updateInstitution);
router.delete('/:id', roleMiddleware(['superadmin']), institutionController.deleteInstitution);

module.exports = router;
