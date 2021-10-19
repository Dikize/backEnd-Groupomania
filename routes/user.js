const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const multer = require('../middlewares/multer-config')

const userController = require('../controllers/user');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.get('/me', auth, userController.getProfile);
router.put('/me', auth, multer.single('profilePicture'), userController.updateProfile);
router.delete('/me', auth, userController.deleteAccount);

module.exports = router;
