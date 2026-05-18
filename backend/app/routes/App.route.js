//Lib
const express = require('express');
const router = express.Router();
// const refController = require('../controllers/Ref.controller');
// const registrationController = require('../controllers/Registration.controller');
const speciesController = require('../controllers/Species.controller');
const authController = require('../controllers/Auth.controller');
const uploadController = require('../controllers/Upload.controller');
const morphController = require('../controllers/MorphGroup.controller');
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

// Admin Routes
router.get('/admin/stats', adminController.getDashboardStats);

// Shops Routes
router.get('/shops', shopsController.getAllShops);
router.get('/shops/:id', shopsController.getShopById);
router.get('/shops/user/:userId', shopsController.getShopByUserId);
router.post('/shops', shopsController.createShop);
router.put('/shops/:id', shopsController.updateShop);
router.delete('/shops/:id', shopsController.deleteShop);

// Listings Routes
router.get('/listings', listingsController.getListings);
router.get('/listings/shop/:shopId', listingsController.getListingsByShop);
router.get('/listings/:id', listingsController.getListingById);
router.post('/listings', listingsController.createListing);
router.put('/listings/:id', listingsController.updateListing);
router.delete('/listings/:id', listingsController.deleteListing);

// Orders Routes
router.get('/orders', ordersController.getAllOrders);
router.get('/orders/user/:user_id', ordersController.getUserOrders);
router.get('/orders/shop/:shop_id', ordersController.getShopOrders);
router.get('/orders/listing/:listing_id', ordersController.getListingOrders);
router.get('/orders/:order_id', ordersController.getOrderById);
router.post('/orders', ordersController.createOrder);
router.put('/orders/:order_id/shipping-info', ordersController.updateShippingInfo);
router.put('/orders/:order_id/shipping-cost', ordersController.updateShippingCost);
router.put('/orders/:order_id/confirm-payment', ordersController.confirmPayment);
router.put('/orders/:order_id/admin-confirm-payment', ordersController.adminConfirmPayment);
router.put('/orders/:order_id/ship-order', ordersController.shipOrder);
router.put('/orders/:order_id/complete', ordersController.completeOrder);
router.put('/orders/:order_id/complain', ordersController.complainOrder);
router.put('/orders/:order_id/resolve-complaint', ordersController.resolveComplaint);
router.put('/orders/:order_id/reset-payment', ordersController.resetPayment);
router.put('/orders/:order_id/cancel', ordersController.cancelOrder);
router.put('/orders/:order_id/request-disbursement', ordersController.requestDisbursement);
router.put('/orders/:order_id/disburse', ordersController.disburseOrder);
router.put('/orders/:order_id/dismiss-cancellation', ordersController.dismissCancellation);
router.delete('/orders/:order_id/history', ordersController.deleteOrderHistory);

// Cart Routes
router.get('/cart/:user_id', cartController.getCart);
router.get('/cart/item/:id', cartController.getCartItemById);
router.post('/cart', cartController.addToCart);
router.delete('/cart/:id', cartController.removeFromCart);
router.delete('/cart/user/:user_id', cartController.clearCart);

// Notifications Routes
router.get('/notifications/list/:user_id', notificationsController.getNotificationsList);
router.get('/notifications/:user_id', notificationsController.getNotificationCounts);
router.put('/notifications/:user_id/read', notificationsController.markCommunityAsRead);
router.put('/notifications/:user_id/read-all', notificationsController.markAllAsRead);
router.delete('/notifications/:user_id', notificationsController.deleteAll);

// Advertisements Routes
router.get('/advertisements', adsController.getAdvertisements);
router.post('/advertisements', adsController.createAdvertisement);
router.put('/advertisements/:id', adsController.updateAdvertisement);
router.delete('/advertisements/:id', adsController.deleteAdvertisement);

// Users Routes
router.get('/users', usersController.getUsers);
router.get('/users/count', usersController.getUserCount);
router.get('/users/:id', usersController.getUserById);
router.put('/users/profile/:id', usersController.updateProfile);
router.put('/users/reset-password/:id', usersController.resetPassword);
router.put('/users/email/:id', usersController.updateEmail);
router.delete('/users/:id', usersController.deleteUser);

// Morph Group Routes
router.get('/morph-groups', morphController.getMorphGroups);
router.get('/morph-groups/:id', morphController.getMorphGroupById);
router.post('/morph-groups', morphController.createMorphGroup);
router.put('/morph-groups/:id', morphController.updateMorphGroup);
router.delete('/morph-groups/:id', morphController.deleteMorphGroup);

// Topics Routes
router.get('/topics', topicsController.getTopics);
router.get('/topics/:id', topicsController.getTopicById);
router.post('/topics', topicsController.createTopic);
router.put('/topics/:id', topicsController.updateTopic);
router.delete('/topics/:id', topicsController.deleteTopic);

router.post('/topics/:topic_id/like', topicsController.toggleLike);

// Comments Routes
router.get('/topics/:topic_id/comments', commentsController.getCommentsByTopic);

// Chat Routes
router.post('/chats/start', chatController.findOrCreateChat);
router.get('/chats/seller/:seller_id', chatController.getSellerChats);
router.get('/chats/product/:product_id', chatController.getProductChatCount);
router.get('/chats/user/:user_id', chatController.getUserChats);
router.get('/chats/:chat_id/messages', chatController.getChatMessages);
router.get('/chats/listing/:product_id', chatController.getProductChatCount); // Alias or additional route if needed




const { validate, verify, checkFileSize, closeRoute } = require('@middlewares/Validator.middleware');

// router.use('/ref');
// router.get('/ref/address/province', refController.getAddressProvince);
// router.get('/ref/address/city', validate("get_address_city"), verify, refController.getAddressCity);
// router.get('/ref/address/district', validate("get_address_city"), verify, refController.getAddressDistrict);
// router.get('/ref/address/subdistrict', validate("get_address_city"), verify, refController.getAddressSubdistrict);

// router.get('/registrations', registrationController.getRegistrations);

// Auth Routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/change-password', authController.changePassword);
router.post('/upload', uploadController.uploadImage);



// Species CMS Routes
router.get('/species', speciesController.getSpecies);
router.get('/species/:slug', speciesController.getSpeciesBySlug);
router.post('/species', validate("create_species"), verify, speciesController.createSpecies);
router.put('/species/:id', validate("update_species"), verify, speciesController.updateSpecies);
router.delete('/species/:id', verify, speciesController.deleteSpecies);


//exports
module.exports = router;