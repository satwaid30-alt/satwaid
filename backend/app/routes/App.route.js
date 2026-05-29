//Lib
const express = require('express');
const router = express.Router();
// const refController = require('../controllers/Ref.controller');
// const registrationController = require('../controllers/Registration.controller');

const authController = require('../controllers/Auth.controller');
const uploadController = require('../controllers/Upload.controller');
const usersController = require('../controllers/Users.controller');
const topicsController = require('../controllers/Topics.controller');
const commentsController = require('../controllers/Comments.controller');
const adsController = require('../controllers/Advertisements.controller');
const shopsController = require('../controllers/Shops.controller');
const listingsController = require('../controllers/Listings.controller');
const ordersController = require('../controllers/Orders.controller');
const cartController = require('../controllers/Cart.controller');
const notificationsController = require('../controllers/Notifications.controller');
const adminController = require('../controllers/Admin.controller');
const chatController = require('../controllers/Chat.controller');
const bidsController = require('../controllers/Bids.controller');
const menuControlsController = require('../controllers/MenuControls.controller');
const { checkAuth, checkAuthAdmin } = require('@middlewares/Auth.middleware');


// Admin Routes
router.get('/admin/stats', checkAuthAdmin, adminController.getDashboardStats);

// Menu Controls Routes
router.get('/menu-controls', menuControlsController.getMenuControls);
router.put('/menu-controls/bulk', checkAuthAdmin, menuControlsController.bulkUpdateMenuControls);
router.put('/menu-controls/:menu_key', checkAuthAdmin, menuControlsController.updateMenuControl);



// Shops Routes
router.get('/shops', shopsController.getAllShops);
router.get('/shops/:id', shopsController.getShopById);
router.get('/shops/user/:userId', shopsController.getShopByUserId);
router.post('/shops', checkAuth, shopsController.createShop);
router.put('/shops/:id', checkAuth, shopsController.updateShop);
router.delete('/shops/:id', checkAuth, shopsController.deleteShop);

// Listings Routes
router.get('/listings', listingsController.getListings);
router.get('/listings/shop/:shopId', listingsController.getListingsByShop);
router.get('/listings/:id', listingsController.getListingById);
router.post('/listings', checkAuth, listingsController.createListing);
router.put('/listings/:id', checkAuth, listingsController.updateListing);
router.delete('/listings/:id', checkAuth, listingsController.deleteListing);

// Bidding Routes
router.get('/listings/:listing_id/bids', bidsController.getBidsByListing);
router.post('/listings/:listing_id/bids', checkAuth, bidsController.createBid);
router.get('/bids/user/:user_id', bidsController.getUserBids);



// Orders Routes
router.get('/orders', checkAuthAdmin, ordersController.getAllOrders);
router.get('/orders/user/:user_id', ordersController.getUserOrders);
router.get('/orders/shop/:shop_id', ordersController.getShopOrders);
router.get('/orders/listing/:listing_id', ordersController.getListingOrders);
router.get('/orders/:order_id', ordersController.getOrderById);
router.post('/orders', checkAuth, ordersController.createOrder);
router.put('/orders/:order_id/shipping-info', checkAuth, ordersController.updateShippingInfo);
router.put('/orders/:order_id/shipping-cost', checkAuth, ordersController.updateShippingCost);
router.put('/orders/:order_id/confirm-payment', checkAuth, ordersController.confirmPayment);
router.put('/orders/:order_id/admin-confirm-payment', checkAuthAdmin, ordersController.adminConfirmPayment);
router.put('/orders/:order_id/ship-order', checkAuth, ordersController.shipOrder);
router.put('/orders/:order_id/complete', checkAuth, ordersController.completeOrder);
router.put('/orders/:order_id/complain', checkAuth, ordersController.complainOrder);
router.put('/orders/:order_id/resolve-complaint', checkAuth, ordersController.resolveComplaint);
router.put('/orders/:order_id/reset-payment', checkAuthAdmin, ordersController.resetPayment);
router.put('/orders/:order_id/cancel', checkAuth, ordersController.cancelOrder);
router.put('/orders/:order_id/request-disbursement', checkAuth, ordersController.requestDisbursement);
router.post('/orders/bulk-request-disbursement', checkAuth, ordersController.bulkRequestDisbursement);
router.post('/orders/bulk-disburse', checkAuthAdmin, ordersController.bulkDisburseOrders);
router.put('/orders/:order_id/disburse', checkAuthAdmin, ordersController.disburseOrder);
router.put('/orders/:order_id/dismiss-cancellation', checkAuth, ordersController.dismissCancellation);
router.delete('/orders/:order_id/history', checkAuthAdmin, ordersController.deleteOrderHistory);

// Cart Routes
router.get('/cart/:user_id', cartController.getCart);
router.get('/cart/item/:id', cartController.getCartItemById);
router.post('/cart', checkAuth, cartController.addToCart);
router.delete('/cart/:id', checkAuth, cartController.removeFromCart);
router.delete('/cart/user/:user_id', checkAuth, cartController.clearCart);

// Notifications Routes
router.get('/notifications/list/:user_id', notificationsController.getNotificationsList);
router.get('/notifications/:user_id', notificationsController.getNotificationCounts);
router.put('/notifications/:user_id/read', checkAuth, notificationsController.markCommunityAsRead);
router.put('/notifications/:user_id/read-all', checkAuth, notificationsController.markAllAsRead);
router.delete('/notifications/:user_id', checkAuth, notificationsController.deleteAll);

// Advertisements Routes
router.get('/advertisements', adsController.getAdvertisements);
router.post('/advertisements', checkAuthAdmin, adsController.createAdvertisement);
router.put('/advertisements/:id', checkAuthAdmin, adsController.updateAdvertisement);
router.delete('/advertisements/:id', checkAuthAdmin, adsController.deleteAdvertisement);

// Users Routes
router.get('/users', checkAuthAdmin, usersController.getUsers);
router.get('/users/count', checkAuthAdmin, usersController.getUserCount);
router.get('/users/:id', usersController.getUserById);
router.put('/users/profile/:id', checkAuth, usersController.updateProfile);
router.put('/users/reset-password/:id', checkAuth, usersController.resetPassword);
router.put('/users/email/:id', checkAuth, usersController.updateEmail);
router.delete('/users/:id', checkAuthAdmin, usersController.deleteUser);

// Topics Routes
router.get('/topics', topicsController.getTopics);
router.get('/topics/:id', topicsController.getTopicById);
router.post('/topics', checkAuth, topicsController.createTopic);
router.put('/topics/:id', checkAuth, topicsController.updateTopic);
router.delete('/topics/:id', checkAuth, topicsController.deleteTopic);

router.post('/topics/:topic_id/like', checkAuth, topicsController.toggleLike);

// Comments Routes
router.get('/topics/:topic_id/comments', commentsController.getCommentsByTopic);

// Chat Routes
router.post('/chats/start', checkAuth, chatController.findOrCreateChat);
router.get('/chats/seller/:seller_id', chatController.getSellerChats);
router.get('/chats/product/:product_id', chatController.getProductChatCount);
router.get('/chats/user/:user_id', chatController.getUserChats);
router.get('/chats/:chat_id/messages', chatController.getChatMessages);
router.put('/chats/:chat_id/read', checkAuth, chatController.markAsRead);
router.get('/chats/listing/:product_id', chatController.getProductChatCount); // Alias or additional route if needed




const { validate, verify, checkFileSize, closeRoute } = require('@middlewares/Validator.middleware');

// router.use('/ref');
// router.get('/ref/address/province', refController.getAddressProvince);
// router.get('/ref/address/city', validate("get_address_city"), verify, refController.getAddressCity);
// router.get('/ref/address/district', validate("get_address_city"), verify, refController.getAddressDistrict);
// router.get('/ref/address/subdistrict', validate("get_address_city"), verify, refController.getAddressSubdistrict);

// router.get('/registrations', registrationController.getRegistrations);

const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes (prevent brute force & spam)
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 menit
    max: 5, // Maksimal 5 percobaan
    message: { message: "Terlalu banyak percobaan untuk rute ini. Silakan coba lagi dalam 10 menit." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth Routes
router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, authController.register);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);
router.post('/upload', uploadController.uploadImage);






//exports
module.exports = router;