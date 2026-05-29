const { Op, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const initModels = require('../database/init');
var models = initModels(sequelize);

const CartController = {
    // Add to Cart
    addToCart: async (req, res) => {
        try {
            const user_id = req.user_data.id;
            const { listing_id, quantity } = req.body;

            if (!listing_id) {
                return res.status(400).json({ message: "Listing ID is required" });
            }

            // Get Listing info
            const listing = await models.listings.findByPk(listing_id);
            if (!listing) {
                return res.status(404).json({ message: "Product not found" });
            }

            if (listing.user_id === user_id) {
                return res.status(400).json({ message: "You cannot add your own product to cart" });
            }

            // Check if user already has an active order for this listing
            const activeOrder = await models.orders.findOne({
                where: {
                    user_id,
                    listing_id,
                    status: {
                        [Op.notIn]: ['completed', 'cancelled', 'complained']
                    }
                }
            });

            if (activeOrder) {
                return res.status(400).json({ message: "Anda sudah memiliki transaksi aktif untuk produk ini. Harap selesaikan terlebih dahulu." });
            }

            // Check if stock is enough
            const requestedQty = parseInt(quantity) || 1;
            if (listing.stock < requestedQty) {
                return res.status(400).json({ message: `Insufficient stock. Only ${listing.stock} available.` });
            }

            // Check if item already in cart
            const existingItem = await models.carts.findOne({
                where: { user_id, listing_id }
            });

            if (existingItem) {
                return res.status(400).json({ message: "Produk ini sudah ada di dalam keranjang Anda. Silakan cek keranjang belanja Anda." });
            }

            // Create new item
            const newItem = await models.carts.create({
                user_id,
                listing_id,
                shop_id: listing.shop_id,
                quantity: requestedQty,
                created_at: Sequelize.fn('now'),
                updated_at: Sequelize.fn('now')
            });
            return res.status(201).json({ message: "Added to cart", data: newItem });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: err.message });
        }
    },

    // Get User Cart
    getCart: async (req, res) => {
        try {
            const { user_id } = req.params;

            const cartItems = await models.carts.findAll({
                where: { user_id },
                include: [
                    {
                        model: models.listings,
                        as: 'product',
                        include: [{ 
                            model: models.shops, 
                            as: 'shop',
                            attributes: ['id', 'name', 'city', 'address', 'logo_url', 'whatsapp']
                        }]
                    }
                ],
                order: [['created_at', 'DESC']]
            });
            const filteredCartItems = cartItems.filter(item => item.product && item.product.stock > 0);
            return res.status(200).json({ data: filteredCartItems });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    // Get Specific Cart Item
    getCartItemById: async (req, res) => {
        try {
            const { id } = req.params;
            const cartItem = await models.carts.findOne({
                where: { id },
                include: [
                    {
                        model: models.listings,
                        as: 'product',
                        include: [{ 
                            model: models.shops, 
                            as: 'shop',
                            attributes: ['id', 'name', 'city', 'address', 'logo_url', 'whatsapp']
                        }]
                    }
                ]
            });
            
            if (!cartItem) {
                return res.status(404).json({ message: "Item tidak ditemukan di keranjang." });
            }
            
            return res.status(200).json({ data: cartItem });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    // Remove from Cart
    removeFromCart: async (req, res) => {
        try {
            const { id } = req.params;
            const cartItem = await models.carts.findByPk(id);
            if (!cartItem) {
                return res.status(404).json({ message: "Item tidak ditemukan di keranjang." });
            }

            // Ownership / Admin check
            const isAdmin = req.user_data.level !== 8 || req.user_data.role === 'admin';
            if (cartItem.user_id !== req.user_data.id && !isAdmin) {
                return res.status(403).json({ message: "Anda tidak memiliki akses untuk menghapus item ini dari keranjang" });
            }

            await cartItem.destroy();
            return res.status(200).json({ message: "Item removed from cart" });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    // Clear Cart
    clearCart: async (req, res) => {
        try {
            const { user_id } = req.params;

            // Ownership / Admin check
            const isAdmin = req.user_data.level !== 8 || req.user_data.role === 'admin';
            if (req.user_data.id !== user_id && !isAdmin) {
                return res.status(403).json({ message: "Anda tidak memiliki akses untuk mengosongkan keranjang ini" });
            }

            await models.carts.destroy({ where: { user_id } });
            return res.status(200).json({ message: "Cart cleared" });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
};

module.exports = CartController;
