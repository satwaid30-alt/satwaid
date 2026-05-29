var DataTypes = require("sequelize").DataTypes;

var _master_account = require("../models/master_account");
var _master_user = require("../models/master_user");
var _users = require("../models/users");

var _topics = require("../models/topics");
var _comments = require("../models/comments");
var _topic_likes = require("../models/topic_likes");
var _advertisements = require("../models/advertisements");
var _shops = require("../models/shops");
var _listings = require("../models/listings");
var _orders = require("../models/orders");
var _carts = require("../models/carts");
var _chats = require("../models/chats");
var _chat_messages = require("../models/chat_messages");
var _notifications = require("../models/notifications");
var _bids = require("../models/bids");
var _menu_controls = require("../models/menu_controls");


function initModels(sequelize) {
  var master_user = _master_user(sequelize, DataTypes);
  var master_account = _master_account(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  var topics = _topics(sequelize, DataTypes);
  var comments = _comments(sequelize, DataTypes);
  var topic_likes = _topic_likes(sequelize, DataTypes);
  var advertisements = _advertisements(sequelize, DataTypes);
  var shops = _shops(sequelize, DataTypes);
  var listings = _listings(sequelize, DataTypes);
  var orders = _orders(sequelize, DataTypes);
  var carts = _carts(sequelize, DataTypes);
  var chats = _chats(sequelize, DataTypes);
  var chat_messages = _chat_messages(sequelize, DataTypes);
  var notifications = _notifications(sequelize, DataTypes);
  var bids = _bids(sequelize, DataTypes);
  var menu_controls = _menu_controls(sequelize, DataTypes);



  
  topics.belongsTo(users, { as: "author", foreignKey: "user_id"});
  users.hasMany(topics, { as: "topics", foreignKey: "user_id"});

  comments.belongsTo(topics, { as: "topic", foreignKey: "topic_id"});
  topics.hasMany(comments, { as: "comments", foreignKey: "topic_id"});

  comments.belongsTo(users, { as: "author", foreignKey: "user_id"});
  users.hasMany(comments, { as: "comments", foreignKey: "user_id"});

  topic_likes.belongsTo(topics, { as: "topic", foreignKey: "topic_id"});
  topics.hasMany(topic_likes, { as: "topic_likes", foreignKey: "topic_id"});

  topic_likes.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(topic_likes, { as: "topic_likes", foreignKey: "user_id"});

  shops.belongsTo(users, { as: "owner", foreignKey: "user_id" });
  users.hasOne(shops, { as: "shop", foreignKey: "user_id" });

  listings.belongsTo(shops, { as: "shop", foreignKey: "shop_id" });
  shops.hasMany(listings, { as: "listings", foreignKey: "shop_id" });

  listings.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(listings, { as: "listings", foreignKey: "user_id" });

  orders.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(orders, { as: "orders", foreignKey: "user_id" });

  orders.belongsTo(listings, { as: "product", foreignKey: "listing_id" });
  listings.hasMany(orders, { as: "orders", foreignKey: "listing_id" });

  orders.belongsTo(shops, { as: "shop", foreignKey: "shop_id" });
  shops.hasMany(orders, { as: "orders", foreignKey: "shop_id" });

  carts.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(carts, { as: "carts", foreignKey: "user_id" });

  carts.belongsTo(listings, { as: "product", foreignKey: "listing_id" });
  listings.hasMany(carts, { as: "carts", foreignKey: "listing_id" });

  carts.belongsTo(shops, { as: "shop", foreignKey: "shop_id" });
  shops.hasMany(carts, { as: "carts", foreignKey: "shop_id" });

  // topics.belongsTo(listings, { as: "product", foreignKey: "image"});
  // listings.hasMany(topics, { as: "chats", foreignKey: "image"});

  // Dedicated Chat System (Separate from Community)
  chats.belongsTo(users, { as: "buyer", foreignKey: "buyer_id" });
  chats.belongsTo(users, { as: "seller", foreignKey: "seller_id" });
  chats.belongsTo(listings, { as: "product", foreignKey: "listing_id" });
  chat_messages.belongsTo(chats, { as: "chat", foreignKey: "chat_id" });
  chat_messages.belongsTo(users, { as: "sender", foreignKey: "sender_id" });
  chats.hasMany(chat_messages, { as: "messages", foreignKey: "chat_id" });
  
  notifications.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(notifications, { as: "notifications", foreignKey: "user_id" });

  bids.belongsTo(listings, { as: "listing", foreignKey: "listing_id" });
  listings.hasMany(bids, { as: "bids", foreignKey: "listing_id" });

  bids.belongsTo(users, { as: "bidder", foreignKey: "user_id" });
  users.hasMany(bids, { as: "bids", foreignKey: "user_id" });


  return {

    master_user,
    master_account,
    users,

    topics,
    comments,
    topic_likes,
    advertisements,
    shops,
    listings,
    orders,
    carts,
    chats,
    chat_messages,
    notifications,
    bids,
    menu_controls
  };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;