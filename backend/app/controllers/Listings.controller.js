const { Sequelize } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

const ListingsController = {
    // 1. Create (POST)
    createListing: async (req, res) => {
        try {
            const {
                name,
                species,
                type,
                price,
                sex,
                description,
                shipping_description,
                images,
                start_bid,
                multiple,
                end_date,
                user_id,
                is_free_shipping,
                is_free_packing,
                shipping_type,
                stock
            } = req.body;

            // Generate Slug
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7);


            // Get Shop ID for this user
            const userShop = await models.shops.findOne({ where: { user_id } });

            if (!userShop) {
                return res.status(400).json({ message: "Anda harus memiliki toko terlebih dahulu untuk berjualan" });
            }

            if (userShop.status?.toLowerCase() === 'suspended') {
                return res.status(403).json({ message: "Toko Anda sedang ditangguhkan (suspended). Anda tidak dapat memasang iklan baru." });
            }

            if (userShop.status?.toLowerCase() === 'pending') {
                return res.status(403).json({ message: "Toko Anda belum diverifikasi oleh admin. Silakan tunggu hingga toko diaktifkan untuk mulai berjualan." });
            }

            // Generate Unique Product ID (e.g. RH-A1B2C3)
            const productId = 'RH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

            const newListing = await models.listings.create({
                shop_id: userShop.id,
                user_id,
                name,
                product_id: productId,
                slug,
                species,
                type,
                price: price ? parseInt(price.toString().replace(/\D/g, '')) : null,
                sex,
                description,
                shipping_description,
                images,
                start_bid: start_bid ? parseInt(start_bid.toString().replace(/\D/g, '')) : null,
                multiple: multiple ? parseInt(multiple.toString().replace(/\D/g, '')) : null,
                end_date: end_date || null,
                status: 'pending',
                is_free_shipping: is_free_shipping || false,
                is_free_packing: is_free_packing || false,
                shipping_type: shipping_type || null,
                stock: stock ? parseInt(stock) : 1
            });

            // Emit to Admin Room for Real-time Dashboard Update
            const io = req.app.get('socketio');
            if (io) {
                // Fetch the new listing with shop details for admin table
                const listingWithShop = await models.listings.findOne({
                    where: { id: newListing.id },
                    include: [{ model: models.shops, as: 'shop' }]
                });
                io.to('admin_room').emit('new_listing_admin', listingWithShop);
            }

            return res.status(201).json({
                message: "Berhasil memasang iklan reptil",
                data: newListing
            });
        } catch (err) {
            console.error("Error creating listing:", err);
            return res.status(500).json({ message: "Gagal memasang iklan: " + err.message });
        }
    },

    // 2. Read All (GET)
    getListings: async (req, res) => {
        try {
            const { all } = req.query;
            const { Op } = require('sequelize');
            const where = {};

            // If not requested 'all' (admin view), only show active and in-stock
            if (all !== 'true') {
                where.status = { [Op.iLike]: 'active' };
                where.stock = { [Op.gt]: 0 }; // Only show products with stock > 0
            } else {
                // For admin, show everything except deleted
                where.status = { [Op.notIn]: ['deleted', 'Deleted'] };
            }

            const data = await models.listings.findAll({
                where,
                attributes: {
                    include: [
                        [
                            Sequelize.literal(`(
                                SELECT order_id
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                ORDER BY created_at DESC
                                LIMIT 1
                            )`),
                            'latestOrderId'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT order_id
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                AND orders.status = 'cancelled'
                                ORDER BY updated_at DESC
                                LIMIT 1
                            )`),
                            'latestCancelledOrderId'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT quantity
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                AND orders.status = 'cancelled'
                                ORDER BY updated_at DESC
                                LIMIT 1
                            )`),
                            'latestCancelledQuantity'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT users.name
                                FROM orders
                                JOIN users ON users.id = orders.user_id
                                WHERE orders.listing_id = "listings"."id"
                                AND orders.status = 'cancelled'
                                ORDER BY orders.updated_at DESC
                                LIMIT 1
                            )`),
                            'latestCancelledBuyer'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT id
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                AND orders.status = 'cancelled'
                                ORDER BY updated_at DESC
                                LIMIT 1
                            )`),
                            'latestCancelledInternalId'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT status
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                ORDER BY created_at DESC
                                LIMIT 1
                            )`),
                            'lastOrderStatus'
                        ]
                    ]
                },
                include: [{
                    model: models.shops,
                    as: 'shop',
                    where: all !== 'true' ? { status: { [Op.iLike]: 'active' } } : {},
                    attributes: {
                        include: [
                            [
                                Sequelize.literal(`(
                                    SELECT COALESCE(ROUND(AVG(rating), 1)::text, '0.0')
                                    FROM orders
                                    WHERE orders.shop_id = "shop"."id"
                                    AND orders.status IN ('completed', 'disbursement_requested', 'disbursed')
                                    AND orders.rating IS NOT NULL
                                )`),
                                'avgRating'
                            ]
                        ]
                    }
                }],
                order: [['created_at', 'DESC']]
            });
            return res.status(200).json({
                message: "Data iklan berhasil diambil",
                data: data
            });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    // 3. Read by Shop (GET)
    getListingsByShop: async (req, res) => {
        try {
            const { shopId } = req.params;
            const { Op } = require('sequelize');
            const where = {
                shop_id: shopId,
                status: { [Op.notIn]: ['deleted', 'Deleted'] }
            };

            // If not requested 'all' (admin/owner view), only show active and in-stock
            const { all } = req.query;
            if (all !== 'true') {
                where.status = { [Op.iLike]: 'active' };
                where.stock = { [Op.gt]: 0 };
            }

            const data = await models.listings.findAll({
                where,
                attributes: {
                    include: [
                        [
                            Sequelize.literal(`(
                                SELECT order_id
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                ORDER BY created_at DESC
                                LIMIT 1
                            )`),
                            'latestOrderId'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT order_id
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                AND orders.status = 'cancelled'
                                ORDER BY updated_at DESC
                                LIMIT 1
                            )`),
                            'latestCancelledOrderId'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT quantity
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                AND orders.status = 'cancelled'
                                ORDER BY updated_at DESC
                                LIMIT 1
                            )`),
                            'latestCancelledQuantity'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT users.name
                                FROM orders
                                JOIN users ON users.id = orders.user_id
                                WHERE orders.listing_id = "listings"."id"
                                AND orders.status = 'cancelled'
                                ORDER BY orders.updated_at DESC
                                LIMIT 1
                            )`),
                            'latestCancelledBuyer'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT id
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                AND orders.status = 'cancelled'
                                ORDER BY updated_at DESC
                                LIMIT 1
                            )`),
                            'latestCancelledInternalId'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT status
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                ORDER BY created_at DESC
                                LIMIT 1
                            )`),
                            'lastOrderStatus'
                        ]
                    ]
                },
                include: [{
                    model: models.shops,
                    as: 'shop',
                    attributes: {
                        include: [
                            [
                                Sequelize.literal(`(
                                    SELECT COALESCE(ROUND(AVG(rating), 1)::text, '0.0')
                                    FROM orders
                                    WHERE orders.shop_id = "shop"."id"
                                    AND orders.status IN ('completed', 'disbursement_requested', 'disbursed')
                                    AND orders.rating IS NOT NULL
                                )`),
                                'avgRating'
                            ]
                        ]
                    }
                }],
                order: [['created_at', 'DESC']]
            });
            return res.status(200).json({
                message: "Data iklan toko berhasil diambil",
                data: data
            });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    // 4. Read by ID (GET)
    getListingById: async (req, res) => {
        try {
            const { id } = req.params;

            // Protection: If ID is not a valid UUID (e.g. "cancelled-INV..."), return 404 early
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(404).json({ message: "Produk tidak ditemukan atau format ID tidak valid" });
            }

            const data = await models.listings.findByPk(id, {
                attributes: {
                    include: [
                        [
                            Sequelize.literal(`(
                                SELECT order_id
                                FROM orders
                                WHERE orders.listing_id = "listings"."id"
                                ORDER BY created_at DESC
                                LIMIT 1
                            )`),
                            'latestOrderId'
                        ]
                    ]
                },
                include: [{
                    model: models.shops,
                    as: 'shop',
                    attributes: {
                        include: [
                            [
                                Sequelize.literal(`(
                                    SELECT COALESCE(ROUND(AVG(rating), 1)::text, '0.0')
                                    FROM orders
                                    WHERE orders.shop_id = "shop"."id"
                                    AND orders.status IN ('completed', 'disbursement_requested', 'disbursed')
                                    AND orders.rating IS NOT NULL
                                )`),
                                'avgRating'
                            ]
                        ]
                    }
                }]
            });
            if (!data) return res.status(404).json({ message: "Iklan tidak ditemukan" });
            return res.status(200).json({
                message: "Detail iklan berhasil diambil",
                data: data
            });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    // 5. Update (PUT)
    updateListing: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name,
                species,
                price,
                sex,
                description,
                shipping_description,
                images,
                start_bid,
                multiple,
                end_date,
                status,
                is_free_shipping,
                is_free_packing,
                shipping_type,
                stock
            } = req.body;

            const listing = await models.listings.findByPk(id, {
                include: [{ model: models.shops, as: 'shop' }]
            });
            if (!listing) return res.status(404).json({ message: "Iklan tidak ditemukan" });

            // Check if shop is suspended (only if it's a seller update, i.e. content is changed)
            const contentFields = ['name', 'species', 'price', 'sex', 'description', 'shipping_description', 'images', 'start_bid', 'multiple', 'end_date', 'is_free_shipping', 'is_free_packing', 'shipping_type'];
            const isContentUpdated = contentFields.some(field => req.body[field] !== undefined);

            if (isContentUpdated && listing.shop?.status?.toLowerCase() === 'suspended') {
                return res.status(403).json({ message: "Toko Anda sedang ditangguhkan (suspended). Anda tidak dapat mengubah iklan." });
            }

            if (isContentUpdated && listing.shop?.status?.toLowerCase() === 'pending') {
                return res.status(403).json({ message: "Toko Anda belum diverifikasi oleh admin. Silakan tunggu hingga toko diaktifkan untuk melakukan perubahan." });
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (species !== undefined) updateData.species = species;
            if (price !== undefined) updateData.price = price ? parseInt(price.toString().replace(/\D/g, '')) : null;
            if (sex !== undefined) updateData.sex = sex;
            if (description !== undefined) updateData.description = description;
            if (shipping_description !== undefined) updateData.shipping_description = shipping_description;
            if (images !== undefined) updateData.images = images;
            if (start_bid !== undefined) updateData.start_bid = start_bid ? parseInt(start_bid.toString().replace(/\D/g, '')) : null;
            if (multiple !== undefined) updateData.multiple = multiple ? parseInt(multiple.toString().replace(/\D/g, '')) : null;
            if (end_date !== undefined) updateData.end_date = end_date;
            if (is_free_shipping !== undefined) updateData.is_free_shipping = is_free_shipping;
            if (is_free_packing !== undefined) updateData.is_free_packing = is_free_packing;
            if (shipping_type !== undefined) updateData.shipping_type = shipping_type;
            if (stock !== undefined) updateData.stock = stock ? parseInt(stock) : 1;

            // Logic for status:
            // If content is updated, force status to 'pending' for re-verification
            if (isContentUpdated) {
                updateData.status = 'pending';
            } else if (status !== undefined) {
                // If only status/rejection is updated (e.g. by admin), use the provided status
                updateData.status = status;
            }

            if (req.body.rejection_reason !== undefined) updateData.rejection_reason = req.body.rejection_reason;

            updateData.updated_at = new Date();

            await listing.update(updateData);

            // IF STATUS IS UPDATED (Moderated by Admin)
            if (status !== undefined && !isContentUpdated) {
                try {
                    const title = status === 'active' ? 'Produk Disetujui' : 'Produk Ditolak';
                    const message = status === 'active'
                        ? `Selamat! Produk "${listing.name}" telah disetujui dan kini tayang di marketplace.`
                        : `Maaf, produk "${listing.name}" ditolak oleh admin. Alasan: ${req.body.rejection_reason || 'Tidak disebutkan'}`;

                    // 1. Create Notification in DB
                    const newNotif = await models.notifications.create({
                        user_id: listing.user_id,
                        type: 'moderation_product',
                        title,
                        message,
                        link: '/user/toko/daftar-produk',
                        created_at: new Date()
                    });

                    // 2. Emit Socket Event
                    const io = req.app.get('socketio');
                    if (io) {
                        io.to(`user_${listing.user_id}`).emit('new_notification', {
                            id: newNotif.id,
                            type: 'moderation_product',
                            title,
                            message,
                            time: newNotif.created_at
                        });
                        // Emit listing status update to update the UI directly
                        console.log(`[Socket] Emitting listing_status_updated to user_${listing.user_id} for listing ${listing.id}`);
                        io.to(`user_${listing.user_id}`).emit('listing_status_updated', {
                            id: listing.id,
                            status: listing.status,
                            rejection_reason: listing.rejection_reason
                        });

                        // Emit to Admin Room for Real-time Dashboard Update
                        io.to('admin_room').emit('listing_updated_admin', listing);
                    }
                } catch (notifErr) {
                    console.error("Failed to create moderation notification:", notifErr);
                }
            }

            return res.status(200).json({
                message: "Iklan berhasil diperbarui",
                data: listing
            });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    // 6. Delete (DELETE)
    deleteListing: async (req, res) => {
        try {
            const { id } = req.params;
            const listing = await models.listings.findByPk(id);
            if (!listing) return res.status(404).json({ message: "Iklan tidak ditemukan" });

            // Check if there are associated orders
            const orderCount = await models.orders.count({ where: { listing_id: id } });

            if (orderCount > 0) {
                // If there are orders, we cannot hard delete due to foreign key constraint
                // So we do a "Soft Delete" by changing the status
                await listing.update({ status: 'deleted' });
                
                const io = req.app.get('socketio');
                if (io) {
                    io.to(`user_${listing.user_id}`).emit('listing_deleted', { id });
                    io.to('admin_room').emit('listing_deleted_admin', { id });
                }

                return res.status(200).json({ message: "Iklan berhasil diarsipkan (soft delete) karena memiliki data transaksi" });
            }

            // If no orders, we can safely delete
            await listing.destroy();
            
            const io = req.app.get('socketio');
            if (io) {
                io.to(`user_${listing.user_id}`).emit('listing_deleted', { id });
                io.to('admin_room').emit('listing_deleted_admin', { id });
            }

            return res.status(200).json({ message: "Iklan berhasil dihapus secara permanen" });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
};

module.exports = ListingsController;
