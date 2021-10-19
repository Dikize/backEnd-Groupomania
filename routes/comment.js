const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');

const commentController = require('../controllers/comment');

router.post('/:articleid', auth, commentController.createComment);
router.get('/:articleid', auth, commentController.getComments);
router.put('/:articleid/:id', auth, commentController.updateComment);
router.delete('/:articleid/:id', auth, commentController.deleteComment);


module.exports = router;