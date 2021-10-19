const express = require('express');
const router = express.Router();

const likeController = require('../controllers/like')

const auth = require('../middlewares/auth');

router.post('/:articleid', auth, likeController.likeArticle);

module.exports = router;