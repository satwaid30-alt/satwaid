const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/Chat.controller');

router.post('/start', ChatController.findOrCreateChat);
router.get('/seller/:seller_id', ChatController.getSellerChats);

module.exports = router;
