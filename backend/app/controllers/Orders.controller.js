const { Sequelize } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);
const ShortUniqueId = require('short-unique-id');

const ADMIN_FEE = 5000;

// Helper: generate order ID like INV/20260507/RH/0001
const generateOrderId = () => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
    const uid = new ShortUniqueId({ length: 6, dictionary: 'number' });
    return `INV/${dateStr}/RH/${uid.rnd()}`;
};

const emitOrderUpdated = (req, order) => {
    if (!order) return;
    const io = req.app.get('socketio');
    if (io) {
        const roomName = `order_${order.id}`;
        const room = io.sockets.adapter.rooms.get(roomName);
        const numClients = room ? room.size : 0;
        console.log(`[Socket Broadcast] Emitting order_updated for order ${order.id} to room ${roomName} (Active clients: ${numClients})`);
        io.to(roomName).emit('order_updated', {
            order_id: order.id,
            status: order.status
        });
    } else {
        console.warn(`[Socket Broadcast Warning] io instance not found in req.app for order ${order.id}`);
    }
};

const OrdersController = {

    // GET /orders - Admin: ambil semua pesanan
    getAllOrders: async (req, res) => {
        try {
            const data = await models.orders.findAll({
                include: [
                    {
                        model: models.listings,
                        as: 'product',
                        attributes: ['id', 'product_id', 'name', 'images', 'type', 'species', 'price', 'description', 'sex', 'shipping_description', 'is_free_shipping', 'is_free_packing', 'stock', 'shipping_type']
                    },
                    {
                        model: models.shops,
                        as: 'shop',
                        attributes: ['id', 'name', 'city', 'address', 'logo_url', 'whatsapp', 'shop_code'],
                        include: [
                            {
                                model: models.users,
                                as: 'owner',
                                attributes: ['id', 'name', 'email', 'bank_accounts', 'phone']
                            }
                        ]
                    },
                    {
                        model: models.users,
                        as: 'user',
                        attributes: ['id', 'username', 'email', 'phone', 'avatar_url', 'city', 'province']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            return res.status(200).json({
                message: 'Semua data pesanan berhasil diambil',
                data
            });
        } catch (err) {
            console.error('getAllOrders error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // GET /orders/user/:user_id - Buyer: ambil pesanan milik user
    getUserOrders: async (req, res) => {
        try {
            const { user_id } = req.params;
            const { Op } = require('sequelize');

            // === AUTO-CLEANUP: Batalkan pesanan zombie ===
            // Pesanan aktif yang produknya sudah terjual (stok=0 atau status='sold')
            // Ini membersihkan order lama yang dibuat sebelum sistem enforcement diterapkan
            // PENTING: Exclude semua status final/selesai agar tidak membatalkan order yang sudah done
            const activeOrders = await models.orders.findAll({
                where: {
                    user_id,
                    status: { [Op.notIn]: ['completed', 'cancelled', 'complained', 'disbursement_requested', 'disbursed', 'cancelled_dismissed'] }
                },
                include: [{
                    model: models.listings,
                    as: 'product',
                    attributes: ['id', 'stock', 'status']
                }]
            });

            for (const order of activeOrders) {
                const product = order.product;
                // Hanya batalkan jika produk SUDAH TERJUAL (status 'sold') oleh orang lain
                // Jangan gunakan stok <= 0 karena pesanan yang sedang berjalan memang mengurangi stok menjadi 0
                if (product && product.status === 'sold') {
                    await order.update({
                        status: 'cancelled',
                        cancelled_at: new Date(),
                        updated_at: new Date()
                    });
                    // Hapus juga dari keranjang jika masih ada
                    await models.carts.destroy({
                        where: { user_id, listing_id: product.id }
                    });
                }
            }
            // === END AUTO-CLEANUP ===

            const data = await models.orders.findAll({
                where: {
                    user_id,
                    status: { [Op.ne]: 'cancelled_dismissed' }
                },
                include: [
                    {
                        model: models.listings,
                        as: 'product',
                        attributes: ['id', 'product_id', 'name', 'images', 'type', 'is_free_shipping', 'is_free_packing', 'species', 'price', 'description', 'sex', 'shipping_description', 'stock', 'status', 'shipping_type']
                    },
                    {
                        model: models.shops,
                        as: 'shop',
                        attributes: ['id', 'name', 'city', 'address', 'logo_url', 'whatsapp', 'shop_code']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            return res.status(200).json({
                message: 'Pesanan user berhasil diambil',
                data
            });
        } catch (err) {
            console.error('getUserOrders error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // GET /orders/shop/:shop_id - Seller: ambil pesanan masuk ke toko
    getShopOrders: async (req, res) => {
        try {
            const { shop_id } = req.params;

            const { Op } = require('sequelize');
            const data = await models.orders.findAll({
                where: {
                    shop_id,
                    status: { [Op.ne]: 'cancelled_dismissed' }
                },
                include: [
                    {
                        model: models.listings,
                        as: 'product',
                        attributes: ['id', 'product_id', 'name', 'images', 'type', 'species', 'price', 'description', 'shipping_description', 'is_free_shipping', 'is_free_packing', 'shipping_type']
                    },
                    {
                        model: models.users,
                        as: 'user',
                        attributes: ['id', 'username', 'name', 'email', 'phone', 'city', 'province']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            return res.status(200).json({
                message: 'Pesanan toko berhasil diambil',
                data
            });
        } catch (err) {
            console.error('getShopOrders error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // GET /orders/listing/:listing_id - Admin/Seller: ambil semua pesanan untuk satu produk
    getListingOrders: async (req, res) => {
        try {
            const { listing_id } = req.params;

            const data = await models.orders.findAll({
                where: { listing_id },
                include: [
                    {
                        model: models.users,
                        as: 'user',
                        attributes: ['id', 'username', 'email', 'phone', 'city', 'province']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            return res.status(200).json({
                message: 'Pesanan produk berhasil diambil',
                data
            });
        } catch (err) {
            console.error('getListingOrders error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // GET /orders/:order_id - Detail satu pesanan
    getOrderById: async (req, res) => {
        try {
            const { order_id } = req.params;

            const queryOptions = {
                include: [
                    {
                        model: models.listings,
                        as: 'product',
                        attributes: ['id', 'product_id', 'name', 'images', 'type', 'is_free_shipping', 'is_free_packing', 'species', 'price', 'description', 'sex', 'shipping_description', 'stock', 'shipping_type']
                    },
                    {
                        model: models.shops,
                        as: 'shop',
                        attributes: ['id', 'name', 'city', 'address', 'logo_url', 'whatsapp', 'shop_code'],
                        include: [
                            {
                                model: models.users,
                                as: 'owner',
                                attributes: ['id', 'name', 'email', 'bank_accounts', 'phone']
                            }
                        ]
                    },
                    {
                        model: models.users,
                        as: 'user',
                        attributes: ['id', 'username', 'email', 'phone', 'avatar_url', 'city', 'province']
                    }
                ]
            };

            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order_id);
            let data = null;
            
            if (isUUID) {
                data = await models.orders.findByPk(order_id, queryOptions).catch(() => null);
            }
            
            if (!data) {
                data = await models.orders.findOne({
                    where: { order_id: order_id },
                    ...queryOptions
                }).catch(() => null);
            }

            if (!data) {
                return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
            }

            return res.status(200).json({
                message: 'Detail pesanan berhasil diambil',
                data
            });
        } catch (err) {
            console.error('getOrderById error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // POST /orders - Buat pesanan baru
    createOrder: async (req, res) => {
        const { Op } = require('sequelize');
        const transaction = await sequelize.transaction();

        try {
            const { user_id, listing_id, quantity } = req.body;

            // Validasi listing dengan LOCK (mencegah race condition double checkout)
            const listing = await models.listings.findByPk(listing_id, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!listing) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Listing tidak ditemukan' });
            }

            // Cek stok
            const requestedQty = parseInt(quantity) || 1;
            if (listing.stock < requestedQty) {
                await transaction.rollback();
                return res.status(400).json({ message: `Maaf, produk sudah laku terjual atau stok tidak mencukupi.` });
            }

            // REMOVED: Check for existing active order for the same product
            // Each purchase should create a new distinct invoice/order.

            // Cek apakah produk sudah ada di keranjang (jika bukan checkout dari keranjang)
            if (!req.body.from_cart) {
                const existingCartItem = await models.carts.findOne({
                    where: { user_id, listing_id },
                    transaction
                });
                if (existingCartItem) {
                    await transaction.rollback();
                    return res.status(400).json({ message: 'Produk ini sudah ada di dalam keranjang Anda. Silakan checkout melalui keranjang untuk mencegah pembelian ganda.' });
                }
            }

            const orderId = generateOrderId();

            // Resolve product price:
            // - BIN purchase (is_bin: true): always charge the bin_price
            // - Normal auction checkout (ended auction, winner pays their bid): use highest bid amount
            // - Regular product: use listing price
            let productPrice;
            const isBIN = req.body.is_bin === true;
            if (listing.type === 'auction') {
                if (isBIN) {
                    // BIN purchase — must have a bin_price
                    if (!listing.bin_price) {
                        await transaction.rollback();
                        return res.status(400).json({ message: 'Harga BIN tidak tersedia untuk produk lelang ini.' });
                    }
                    productPrice = Number(listing.bin_price);
                } else {
                    // Normal ended-auction checkout: must be the highest bidder (winner)
                    const highestBid = await models.bids.findOne({
                        where: { listing_id },
                        order: [['bid_amount', 'DESC']],
                        transaction
                    });

                    if (!highestBid) {
                        await transaction.rollback();
                        return res.status(400).json({ message: 'Lelang ini tidak memiliki penawaran, tidak dapat memproses transaksi.' });
                    }

                    if (highestBid.user_id !== user_id) {
                        await transaction.rollback();
                        return res.status(403).json({ message: 'Hanya pemenang lelang (penawar tertinggi) yang dapat memproses transaksi ini.' });
                    }

                    productPrice = Number(highestBid.bid_amount);
                }
            } else {
                productPrice = Number(listing.price) || 0;
            }

            const subtotal = productPrice * requestedQty;
            const totalPrice = subtotal + ADMIN_FEE;

            const order = await models.orders.create({
                order_id: orderId,
                user_id,
                listing_id,
                shop_id: listing.shop_id,
                quantity: requestedQty,
                price: productPrice,
                admin_fee: ADMIN_FEE,
                total_price: totalPrice,
                status: 'pending_shipping_info'
            }, { transaction });

            // Kurangi stok produk & update status lelang jika bertipe lelang
            const newStock = listing.stock - requestedQty;
            const updateFields = {
                stock: newStock,
                updated_at: new Date()
            };
            if (listing.type === 'auction') {
                updateFields.end_date = new Date();
                updateFields.status = 'ended';
            }
            await listing.update(updateFields, { transaction });

            // Sinkronisasi Keranjang (Cart)
            if (newStock <= 0) {
                // Jika stok habis, hapus produk ini dari keranjang SEMUA pembeli lain
                await models.carts.destroy({
                    where: { listing_id: listing_id },
                    transaction
                });
            } else {
                // Jika masih ada stok, cukup hapus dari keranjang pembeli ini saja
                await models.carts.destroy({
                    where: {
                        user_id: user_id,
                        listing_id: listing_id
                    },
                    transaction
                });
            }

            await transaction.commit();

            // Emit Notification to Seller
            const io = req.app.get('socketio');
            if (io) {
                console.log(`[Socket] Broadcasting listing_stock_updated for listing ${listing.id}: stock=${newStock}`);
                io.emit('listing_stock_updated', {
                    listing_id: listing.id,
                    stock: newStock
                });
                io.to('admin_room').emit('order_updated_admin', { order_id: orderId, status: 'pending_shipping_info' });
                const shop = await models.shops.findByPk(listing.shop_id);
                if (shop) {
                    const buyer = await models.users.findByPk(user_id);
                    const buyerName = buyer?.name || buyer?.username || 'Seseorang';

                    console.log(`Emitting new_notification to user_${shop.user_id} for new order ${orderId}`);

                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        type: 'order_seller',
                        title: 'Pesanan Baru Diterima',
                        message: `${buyerName} memesan "${listing.name}".`,
                        link: '/user/toko/dashboard',
                        time: new Date()
                    });

                    // Emit to Buyer to refresh their Navbar counts
                    io.to(`user_${user_id}`).emit('new_notification', {
                        type: 'order_buyer',
                        title: 'Pesanan Berhasil Dibuat',
                        message: `Pesanan "${listing.name}" berhasil dibuat. Silakan tunggu informasi pengiriman.`,
                        link: `/user/pesanan`,
                        time: new Date()
                    });
                }

                // If this was a BIN purchase, notify all users in the auction room that auction ended
                if (isBIN && listing.type === 'auction') {
                    const buyer = await models.users.findByPk(user_id);
                    const buyerName = buyer?.name || buyer?.username || 'Seseorang';
                    io.to(`auction_${listing_id}`).emit('auction_ended', {
                        listing_id: listing.id,
                        ended_at: new Date().toISOString(),
                        reason: 'bin_purchase',
                        buyer_name: buyerName,
                        winner_id: user_id,
                        order_uuid: order.id,
                        order_id: order.order_id
                    });
                }
            }

            return res.status(201).json({
                message: 'Pesanan berhasil dibuat',
                data: order
            });
        } catch (err) {
            await transaction.rollback();
            console.error('createOrder error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/shipping-info - Buyer isi data pengiriman
    updateShippingInfo: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { receiver_name, phone_number, shipping_address, bank_name, bank_account, bank_holder } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            await order.update({
                receiver_name,
                phone_number,
                shipping_address,
                bank_name: bank_name || null,
                bank_account: bank_account || null,
                bank_holder: bank_holder || null,
                status: 'waiting_shipping_cost',
                address_filled_at: new Date(),   // ← otomatis
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit to Seller
            const io = req.app.get('socketio');
            if (io) {
                io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                const shop = await models.shops.findByPk(order.shop_id);
                if (shop) {
                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        type: 'order_seller',
                        title: 'Alamat Pengiriman Diisi',
                        message: `Pembeli telah mengisi alamat untuk pesanan ${order.order_id}. Silakan input ongkir.`,
                        link: '/user/toko/dashboard',
                        time: new Date()
                    });

                    // Emit to Buyer to refresh their Navbar
                    io.to(`user_${order.user_id}`).emit('new_notification', {
                        type: 'order_buyer',
                        title: 'Alamat Pengiriman Diperbarui',
                        message: `Anda telah mengisi alamat pengiriman untuk pesanan ${order.order_id}.`,
                        link: `/user/pesanan/transaksi/${order.order_id}`,
                        time: new Date()
                    });
                }
            }

            return res.status(200).json({
                message: 'Info pengiriman berhasil disimpan',
                data: order
            });
        } catch (err) {
            console.error('updateShippingInfo error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/shipping-cost - Seller masukkan ongkir & packing
    updateShippingCost: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { shipping_cost, packing_cost, bank_name, bank_account, bank_holder } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            const shippingCost = parseInt(shipping_cost) || 0;
            const packingCost = parseInt(packing_cost) || 0;
            const adminFee = ADMIN_FEE;

            const newTotal = (order.price * order.quantity) + shippingCost + packingCost + adminFee;

            await order.update({
                shipping_cost: shippingCost,
                packing_cost: packingCost,
                admin_fee: adminFee,
                total_price: newTotal,
                bank_name: bank_name || order.bank_name,
                bank_account: bank_account || order.bank_account,
                bank_holder: bank_holder || order.bank_holder,
                status: 'waiting_payment',
                shipping_cost_set_at: new Date(),   // ← otomatis
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit to Buyer
            const io = req.app.get('socketio');
            if (io) {
                io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                io.to(`user_${order.user_id}`).emit('new_notification', {
                    type: 'order_buyer',
                    title: 'Biaya Pengiriman Tersedia',
                    message: `Biaya pengiriman untuk pesanan ${order.order_id} telah ditentukan. Silakan lakukan pembayaran.`,
                    link: `/user/pesanan`,
                    time: new Date()
                });

                // Emit to Seller
                const shop = await models.shops.findByPk(order.shop_id);
                if (shop) {
                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        type: 'order_seller',
                        title: 'Biaya Pengiriman Diupdate',
                        message: `Anda telah memperbarui biaya pengiriman untuk pesanan ${order.order_id}.`,
                        link: '/user/toko/dashboard',
                        time: new Date()
                    });
                }
            }

            return res.status(200).json({
                message: 'Biaya pengiriman berhasil diperbarui',
                data: order
            });
        } catch (err) {
            console.error('updateShippingCost error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/confirm-payment - Buyer upload bukti bayar
    confirmPayment: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { payment_proof } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            await order.update({
                payment_proof: payment_proof || null,
                status: 'processing',
                payment_uploaded_at: new Date(),   // ← otomatis
                payment_rejection_reason: null,
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit to Seller
            const io = req.app.get('socketio');
            if (io) {
                io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                const shop = await models.shops.findByPk(order.shop_id);
                if (shop) {
                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        type: 'order_seller',
                        title: 'Pembayaran Diterima',
                        message: `Pembeli telah mengunggah bukti pembayaran untuk pesanan ${order.order_id}.`,
                        link: '/user/toko/dashboard',
                        time: new Date()
                    });

                    // Emit to Buyer to refresh their Navbar
                    io.to(`user_${order.user_id}`).emit('new_notification', {
                        type: 'order_buyer',
                        title: 'Pembayaran Terkirim',
                        message: `Bukti pembayaran untuk pesanan ${order.order_id} telah terkirim.`,
                        link: `/user/pesanan/transaksi/${order.order_id}`,
                        time: new Date()
                    });
                }
            }

            return res.status(200).json({
                message: 'Bukti pembayaran berhasil dikirim',
                data: order
            });
        } catch (err) {
            console.error('confirmPayment error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/admin-confirm-payment - Admin verifikasi pembayaran
    adminConfirmPayment: async (req, res) => {
        try {
            const { order_id } = req.params;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            await order.update({
                status: 'payment_verified',
                payment_verified_at: new Date(),   // ← otomatis
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit to both Buyer and Seller
            const io = req.app.get('socketio');
            if (io) {
                io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                // Emit to Buyer
                io.to(`user_${order.user_id}`).emit('new_notification', {
                    type: 'order_buyer',
                    title: 'Pembayaran Diverifikasi',
                    message: `Pembayaran untuk pesanan ${order.order_id} telah diverifikasi oleh admin.`,
                    link: `/user/pesanan/transaksi/${order.order_id}`,
                    time: new Date()
                });

                // Emit to Seller
                const shop = await models.shops.findByPk(order.shop_id);
                if (shop) {
                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        type: 'order_seller',
                        title: 'Pembayaran Terverifikasi',
                        message: `Pembayaran untuk pesanan ${order.order_id} telah diverifikasi. Silakan proses pengiriman.`,
                        link: '/user/toko/dashboard',
                        time: new Date()
                    });
                }
            }

            return res.status(200).json({
                message: 'Pembayaran berhasil diverifikasi oleh admin',
                data: order
            });
        } catch (err) {
            console.error('adminConfirmPayment error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/ship-order - Seller input nomor resi & bukti kirim
    shipOrder: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { tracking_number, shipping_proof } = req.body;

            console.log(`[shipOrder] Called by user_data:`, req.user_data);
            console.log(`[shipOrder] order_id: ${order_id}, tracking: ${tracking_number}`);

            if (!tracking_number) {
                return res.status(400).json({ message: 'Nomor resi wajib diisi' });
            }

            const order = await models.orders.findByPk(order_id, {
                include: [
                    {
                        model: models.shops,
                        as: 'shop',
                        attributes: ['id', 'user_id']
                    }
                ]
            });
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            // Validasi status: hanya bisa ship jika payment_verified atau waiting_shipment
            const allowedStatuses = ['payment_verified', 'waiting_shipment'];
            if (!allowedStatuses.includes(order.status)) {
                return res.status(400).json({
                    message: `Status pesanan tidak valid untuk pengiriman. Status saat ini: ${order.status}`
                });
            }

            // Validasi kepemilikan: hanya seller toko ini yang bisa kirim
            const callerUserId = req.user_data?.id || req.user_data?.user_id;
            if (order.shop && order.shop.user_id !== callerUserId) {
                console.warn(`[shipOrder] Unauthorized: caller ${callerUserId} is not owner ${order.shop.user_id}`);
                return res.status(403).json({ message: 'Anda tidak memiliki akses untuk pesanan ini' });
            }

            await order.update({
                tracking_number: tracking_number || null,
                shipping_proof: shipping_proof || null,
                status: 'shipped',
                shipped_at: new Date(),
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit to Buyer & Admin
            const io = req.app.get('socketio');
            if (io) {
                io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: 'shipped' });
                io.to(`user_${order.user_id}`).emit('new_notification', {
                    type: 'order_buyer',
                    title: 'Pesanan Dikirim',
                    message: `Pesanan ${order.order_id} sedang dalam perjalanan. Resi: ${tracking_number || '-'}`,
                    link: `/user/pesanan`,
                    time: new Date()
                });

                // Emit to Seller
                if (order.shop) {
                    io.to(`user_${order.shop.user_id}`).emit('new_notification', {
                        type: 'order_seller',
                        title: 'Pesanan Telah Dikirim',
                        message: `Anda telah menandai pesanan ${order.order_id} sebagai dikirim.`,
                        link: '/user/toko/dashboard',
                        time: new Date()
                    });
                }
            }

            return res.status(200).json({
                message: 'Pesanan berhasil dikirim',
                data: order
            });
        } catch (err) {
            console.error('shipOrder error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/complete - Buyer konfirmasi pesanan diterima (selesai)
    completeOrder: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { rating, review } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            // Update listing status to 'sold' jika benar-benar sudah habis
            if (order.listing_id) {
                const { Op } = require('sequelize');
                const listing = await models.listings.findByPk(order.listing_id);

                if (listing) {
                    // Hitung pesanan lain yang masih aktif untuk produk ini
                    const otherActiveOrders = await models.orders.count({
                        where: {
                            listing_id: order.listing_id,
                            id: { [Op.ne]: order.id },
                            status: { [Op.notIn]: ['completed', 'cancelled', 'complained'] }
                        }
                    });

                    // Hanya tandai 'sold' jika stok 0 DAN tidak ada pesanan lain yang sedang diproses
                    if (listing.stock <= 0 && otherActiveOrders === 0) {
                        await listing.update({
                            status: 'sold',
                            sold_at: new Date(),
                            updated_at: new Date()
                        });

                        // Hapus dari keranjang SEMUA pembeli (jika masih ada)
                        await models.carts.destroy({
                            where: { listing_id: order.listing_id }
                        });
                    }
                }
            }

            await order.update({
                status: 'completed',
                rating: rating || null,
                review: review || null,
                completed_at: new Date(),
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Fetch shop to get seller's user_id
            const shop = await models.shops.findByPk(order.shop_id);
            if (shop) {
                try {
                    const title = 'Transaksi Selesai';
                    const message = `Pembeli telah mengkonfirmasi penerimaan barang untuk pesanan ${order.order_id}. Dana akan segera diproses ke saldo Anda.`;

                    const newNotif = await models.notifications.create({
                        user_id: shop.user_id,
                        type: 'order_completed',
                        title,
                        message,
                        link: '/user/toko/dashboard',
                        created_at: new Date()
                    });

                    const io = req.app.get('socketio');
                    if (io) {
                        io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                        io.to(`user_${shop.user_id}`).emit('new_notification', {
                            id: newNotif.id,
                            type: 'order_completed',
                            title,
                            message,
                            time: newNotif.created_at
                        });

                        // Emit to buyer to trigger count update
                        io.to(`user_${order.user_id}`).emit('new_notification', {
                            type: 'order_buyer',
                            title: 'Pesanan Selesai',
                            message: `Anda telah mengkonfirmasi penyelesaian pesanan ${order.order_id}.`,
                            link: `/user/pesanan/transaksi-selesai/${order.order_id}`,
                            time: new Date()
                        });
                    }
                } catch (notifErr) {
                    console.error("Failed to create completion notification:", notifErr);
                }
            }

            return res.status(200).json({
                message: 'Pesanan selesai. Terima kasih!',
                data: order
            });
        } catch (err) {
            console.error('completeOrder error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/complain - Buyer ajukan komplain
    complainOrder: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { complaint_description, complaint_image, rating, review } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            await order.update({
                status: 'complained',
                complaint_description: complaint_description || null,
                complaint_image: complaint_image || null,
                rating: rating || null,
                review: review || null,
                cancelled_at: new Date(),   // ← otomatis (gunakan sebagai waktu eskalasi)
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            const shop = await models.shops.findByPk(order.shop_id);
            const io = req.app.get('socketio');
            if (io) {
                io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                // Emit to seller
                if (shop) {
                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        type: 'order_seller',
                        title: 'Pesanan Dikomplain',
                        message: `Pembeli mengajukan komplain untuk pesanan ${order.order_id}.`,
                        link: `/user/toko/dashboard`,
                        time: new Date()
                    });
                }

                // Emit to buyer
                io.to(`user_${order.user_id}`).emit('new_notification', {
                    type: 'order_buyer',
                    title: 'Komplain Diajukan',
                    message: `Komplain untuk pesanan ${order.order_id} berhasil diajukan.`,
                    link: `/user/pesanan/transaksi-selesai/${order.order_id}`,
                    time: new Date()
                });
            }

            return res.status(200).json({
                message: 'Komplain berhasil diajukan',
                data: order
            });
        } catch (err) {
            console.error('complainOrder error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/resolve-complaint - Buyer selesaikan komplain
    resolveComplaint: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { rating, review } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            if (order.status !== 'complained') {
                return res.status(400).json({ message: 'Pesanan ini tidak dalam status komplain' });
            }

            await order.update({
                status: 'completed',
                rating: rating || null,
                review: review || null,
                completed_at: new Date(),
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit to Seller
            const shop = await models.shops.findByPk(order.shop_id);
            if (shop) {
                try {
                    const title = 'Komplain Diselesaikan';
                    const message = `Pembeli telah menyelesaikan komplain untuk pesanan ${order.order_id}. Dana akan segera diproses ke saldo Anda.`;

                    const newNotif = await models.notifications.create({
                        user_id: shop.user_id,
                        type: 'order_completed',
                        title,
                        message,
                        link: '/user/toko/dashboard',
                        created_at: new Date()
                    });

                    const io = req.app.get('socketio');
                    if (io) {
                        io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                        io.to(`user_${shop.user_id}`).emit('new_notification', {
                            id: newNotif.id,
                            type: 'order_completed',
                            title,
                            message,
                            time: newNotif.created_at
                        });

                        // Emit to buyer
                        io.to(`user_${order.user_id}`).emit('new_notification', {
                            type: 'order_buyer',
                            title: 'Komplain Diselesaikan',
                            message: `Anda telah menyelesaikan komplain untuk pesanan ${order.order_id}.`,
                            link: `/user/pesanan/transaksi-selesai/${order.order_id}`,
                            time: new Date()
                        });
                    }
                } catch (notifErr) {
                    console.error("Failed to create resolve complaint notification:", notifErr);
                }
            }

            return res.status(200).json({
                message: 'Komplain berhasil diselesaikan',
                data: order
            });
        } catch (err) {
            console.error('resolveComplaint error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/reset-payment - Reset bukti bayar (buyer kirim ulang)
    resetPayment: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { payment_rejection_reason } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            await order.update({
                payment_proof: null,
                status: 'waiting_payment',
                payment_rejection_reason: payment_rejection_reason || null,
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Create notification database record for the buyer
            try {
                const io = req.app.get('socketio');
                const title = 'Bukti Pembayaran Ditolak';
                const message = `Bukti pembayaran untuk pesanan ${order.order_id} ditolak oleh admin. Alasan: ${payment_rejection_reason || 'Tidak ada alasan spesifik.'}`;
                const newNotif = await models.notifications.create({
                    user_id: order.user_id,
                    type: 'order_buyer',
                    title,
                    message,
                    link: `/user/pesanan/bayar/${order.id}`,
                    created_at: new Date()
                });

                if (io) {
                    io.to(`user_${order.user_id}`).emit('new_notification', {
                        id: newNotif.id,
                        type: 'order_buyer',
                        title,
                        message,
                        link: newNotif.link,
                        time: newNotif.created_at
                    });
                }

                // Create database notification for seller & emit socket
                const shop = await models.shops.findByPk(order.shop_id);
                if (shop) {
                    const sellerNotif = await models.notifications.create({
                        user_id: shop.user_id,
                        type: 'order_seller',
                        title: 'Bukti Pembayaran Pembeli Ditolak Admin',
                        message: `Bukti pembayaran dari pembeli untuk pesanan ${order.order_id} ditolak oleh admin. Alasan: ${payment_rejection_reason || 'Tidak ada alasan spesifik.'}`,
                        link: `/user/toko/dashboard`,
                        created_at: new Date()
                    });
                    if (io) {
                        io.to(`user_${shop.user_id}`).emit('new_notification', {
                            id: sellerNotif.id,
                            type: 'order_seller',
                            title: sellerNotif.title,
                            message: sellerNotif.message,
                            link: sellerNotif.link,
                            time: sellerNotif.created_at
                        });
                    }
                }
            } catch (notifErr) {
                console.error("Failed to create rejection notifications:", notifErr);
            }

            return res.status(200).json({
                message: 'Pembayaran direset, silakan upload ulang bukti bayar',
                data: order
            });
        } catch (err) {
            console.error('resetPayment error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/cancel - Batalkan pesanan (Seller/Buyer)
    cancelOrder: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { cancellation_reason } = req.body;

            const order = await models.orders.findByPk(order_id, {
                include: [
                    {
                        model: models.shops,
                        as: 'shop',
                        attributes: ['id', 'user_id']
                    }
                ]
            });
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            // Enforce authorization
            const callerUserId = req.user_data?.id || req.user_data?.user_id;
            const isBuyer = String(order.user_id) === String(callerUserId);
            const isSeller = order.shop && String(order.shop.user_id) === String(callerUserId);

            if (!isBuyer && !isSeller) {
                return res.status(403).json({ message: 'Anda tidak memiliki akses untuk membatalkan pesanan ini' });
            }

            if (['completed', 'cancelled', 'shipped'].includes(order.status)) {
                return res.status(400).json({ message: 'Pesanan tidak dapat dibatalkan pada tahap ini' });
            }

            // Kembalikan stok jika pesanan dibatalkan
            let newStock = null;
            if (order.listing_id) {
                const listing = await models.listings.findByPk(order.listing_id);
                if (listing) {
                    // Jika sebelumnya listing ditandai 'sold' karena stok 0, kembalikan ke 'active'
                    const newStatus = listing.status === 'sold' ? 'active' : listing.status;
                    newStock = listing.stock + order.quantity;
                    await listing.update({
                        stock: newStock,
                        status: newStatus,
                        updated_at: new Date()
                    });
                }
            }

            // Determine default cancellation reason based on who cancelled
            const defaultReason = isBuyer ? 'Dibatalkan oleh pembeli' : 'Dibatalkan oleh penjual/sistem';

            // Update status pesanan
            await order.update({
                status: 'cancelled',
                rejection_reason: cancellation_reason || defaultReason,
                refund_status: null,
                cancelled_at: new Date(),
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit Notification to Buyer
            const io = req.app.get('socketio');
            if (io) {
                if (newStock !== null) {
                    console.log(`[Socket] Broadcasting listing_stock_updated (on cancel) for listing ${order.listing_id}: stock=${newStock}`);
                    io.emit('listing_stock_updated', {
                        listing_id: order.listing_id,
                        stock: newStock
                    });
                }
                io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                io.to(`user_${order.user_id}`).emit('new_notification', {
                    type: 'order_buyer',
                    title: 'Pesanan Dibatalkan',
                    message: `Pesanan ${order.order_id} telah dibatalkan. Alasan: ${cancellation_reason || '-'}`,
                    link: `/user/pesanan`,
                    time: new Date()
                });

                // Emit to seller
                const shop = await models.shops.findByPk(order.shop_id);
                if (shop) {
                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        type: 'order_seller',
                        title: 'Pesanan Dibatalkan',
                        message: `Pesanan ${order.order_id} telah dibatalkan.`,
                        link: `/user/toko/dashboard`,
                        time: new Date()
                    });
                }
            }

            return res.status(200).json({
                message: 'Pesanan berhasil dibatalkan',
                data: order
            });
        } catch (err) {
            console.error('cancelOrder error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/admin-cancel - Batalkan pesanan oleh Admin
    adminCancelOrder: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { cancellation_reason } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            if (order.status !== 'waiting_payment') {
                return res.status(400).json({ message: 'Pesanan tidak dapat dibatalkan pada tahap ini' });
            }

            // Kembalikan stok jika pesanan dibatalkan
            let newStock = null;
            if (order.listing_id) {
                const listing = await models.listings.findByPk(order.listing_id);
                if (listing) {
                    const newStatus = listing.status === 'sold' ? 'active' : listing.status;
                    newStock = listing.stock + order.quantity;
                    await listing.update({
                        stock: newStock,
                        status: newStatus,
                        updated_at: new Date()
                    });
                }
            }

            // Update status pesanan
            await order.update({
                status: 'cancelled',
                rejection_reason: cancellation_reason || 'Dibatalkan oleh Admin (Pembayaran Ditolak)',
                refund_status: null,
                cancelled_at: new Date(),
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit Notification to Buyer & Seller
            const io = req.app.get('socketio');
            if (io) {
                if (newStock !== null) {
                    console.log(`[Socket] Broadcasting listing_stock_updated (on admin cancel) for listing ${order.listing_id}: stock=${newStock}`);
                    io.emit('listing_stock_updated', {
                        listing_id: order.listing_id,
                        stock: newStock
                    });
                }
                io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                
                // Create database notification for buyer & emit socket
                const buyerNotif = await models.notifications.create({
                    user_id: order.user_id,
                    type: 'order_buyer',
                    title: 'Pesanan Dibatalkan oleh Admin',
                    message: `Pesanan ${order.order_id} telah dibatalkan oleh Admin. Alasan: ${cancellation_reason || '-'}`,
                    link: `/user/pesanan`,
                    created_at: new Date()
                });
                io.to(`user_${order.user_id}`).emit('new_notification', {
                    id: buyerNotif.id,
                    type: 'order_buyer',
                    title: buyerNotif.title,
                    message: buyerNotif.message,
                    link: buyerNotif.link,
                    time: buyerNotif.created_at
                });

                // Create database notification for seller & emit socket
                const shop = await models.shops.findByPk(order.shop_id);
                if (shop) {
                    const sellerNotif = await models.notifications.create({
                        user_id: shop.user_id,
                        type: 'order_seller',
                        title: 'Pesanan Dibatalkan oleh Admin',
                        message: `Pesanan ${order.order_id} telah dibatalkan oleh Admin. Alasan: ${cancellation_reason || '-'}`,
                        link: `/user/toko/dashboard`,
                        created_at: new Date()
                    });
                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        id: sellerNotif.id,
                        type: 'order_seller',
                        title: sellerNotif.title,
                        message: sellerNotif.message,
                        link: sellerNotif.link,
                        time: sellerNotif.created_at
                    });
                }
            }

            return res.status(200).json({
                message: 'Pesanan berhasil dibatalkan oleh Admin',
                data: order
            });
        } catch (err) {
            console.error('adminCancelOrder error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // DELETE /orders/:order_id/history - Hapus riwayat pesanan yang sudah selesai
    deleteOrderHistory: async (req, res) => {
        try {
            const { order_id } = req.params;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            if (!['completed', 'cancelled', 'complained', 'cancelled_dismissed'].includes(order.status)) {
                return res.status(400).json({ message: 'Hanya pesanan selesai/batal yang bisa dihapus dari riwayat' });
            }

            await order.destroy();

            return res.status(200).json({
                message: 'Riwayat pesanan berhasil dihapus'
            });
        } catch (err) {
            console.error('deleteOrderHistory error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/request-disbursement - Seller mengajukan pencairan dana
    requestDisbursement: async (req, res) => {
        try {
            const { order_id } = req.params;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            if (order.status !== 'completed') {
                return res.status(400).json({ message: 'Hanya pesanan berstatus selesai yang dapat diajukan pencairannya' });
            }

            await order.update({
                status: 'disbursement_requested',
                disbursement_requested_at: new Date(),
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit Notification to Admin (if needed)
            const io = req.app.get('socketio');
            if (io) {
                // Admin typically doesn't have a specific user_id room like user_X, 
                // but we can broadcast or use a specific admin room
                io.emit('admin_notification', {
                    type: 'disbursement_request',
                    title: 'Pengajuan Pencairan Baru',
                    message: `Seller mengajukan pencairan untuk pesanan ${order.order_id}`,
                    link: '/admin/keuangan',
                    time: new Date()
                });
            }

            return res.status(200).json({
                message: 'Pengajuan pencairan dana berhasil dikirim',
                data: order
            });
        } catch (err) {
            console.error('requestDisbursement error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // POST /orders/bulk-request-disbursement - Seller mengajukan pencairan dana sekaligus
    bulkRequestDisbursement: async (req, res) => {
        try {
            const { order_ids } = req.body;

            if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
                return res.status(400).json({ message: 'Daftar ID pesanan tidak boleh kosong' });
            }

            const { Op } = require('sequelize');
            const orders = await models.orders.findAll({
                where: {
                    id: order_ids,
                    status: 'completed'
                }
            });

            if (orders.length === 0) {
                return res.status(400).json({ message: 'Tidak ada pesanan berstatus selesai yang valid untuk dicairkan' });
            }

            // Update status untuk semua pesanan terpilih
            await models.orders.update({
                status: 'disbursement_requested',
                disbursement_requested_at: new Date(),
                updated_at: new Date()
            }, {
                where: {
                    id: orders.map(o => o.id)
                }
            });

            // Emit notifications
            const io = req.app.get('socketio');
            if (io) {
                // Emit event to admin page for real-time update
                io.to('admin_room').emit('order_updated_admin', { status: 'disbursement_requested' });

                for (const order of orders) {
                    order.status = 'disbursement_requested';
                    emitOrderUpdated(req, order);

                    io.emit('admin_notification', {
                        type: 'disbursement_request',
                        title: 'Pengajuan Pencairan Baru',
                        message: `Seller mengajukan pencairan untuk pesanan ${order.order_id}`,
                        link: '/admin/keuangan',
                        time: new Date()
                    });
                }
            }

            return res.status(200).json({
                message: `${orders.length} pesanan berhasil diajukan pencairannya sekaligus`,
                count: orders.length
            });
        } catch (err) {
            console.error('bulkRequestDisbursement error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // PUT /orders/:order_id/disburse - Admin upload bukti transfer ke seller
    disburseOrder: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { disbursement_proof, disbursement_notes, additional_fee } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            // Guard: hanya proses jika order sudah dalam status pengajuan pencairan
            if (!['completed', 'disbursement_requested'].includes(order.status)) {
                return res.status(400).json({ message: 'Pesanan tidak dalam status yang valid untuk pencairan dana' });
            }

            // FIX: Update status ke 'disbursed' setelah admin mencairkan dana
            await order.update({
                status: 'disbursed',
                disbursement_proof: disbursement_proof || null,
                disbursement_notes: disbursement_notes || null,
                additional_fee: parseInt(additional_fee) || 0,
                disbursed_at: new Date(),
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Emit Notification to Seller
            const io = req.app.get('socketio');
            if (io) {
                io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });
                const shop = await models.shops.findByPk(order.shop_id);
                if (shop) {
                    // 1. Save to Database
                    await models.notifications.create({
                        user_id: shop.user_id,
                        type: 'disbursement',
                        title: 'Dana Dicairkan',
                        message: `Dana untuk pesanan ${order.order_id} telah dicairkan. Silakan cek riwayat transaksi.`,
                        link: '/user/toko/pengajuan-keuangan',
                        is_read: false,
                        created_at: new Date()
                    });

                    // 2. Emit Real-time Socket
                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        type: 'disbursement',
                        title: 'Dana Dicairkan',
                        message: `Dana untuk pesanan ${order.order_id} telah dicairkan. Silakan cek riwayat transaksi.`,
                        link: '/user/toko/pengajuan-keuangan',
                        time: new Date()
                    });
                }
            }

            return res.status(200).json({
                message: 'Dana berhasil dicairkan ke seller',
                data: order
            });
        } catch (err) {
            console.error('disburseOrder error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    // POST /orders/bulk-disburse - Admin upload bukti transfer dan cairkan banyak pesanan sekaligus
    bulkDisburseOrders: async (req, res) => {
        try {
            const { order_ids, disbursement_proof, disbursement_notes, additional_fee } = req.body;

            if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
                return res.status(400).json({ message: 'Daftar ID pesanan tidak boleh kosong' });
            }

            const { Op } = require('sequelize');
            const orders = await models.orders.findAll({
                where: {
                    id: order_ids,
                    status: ['completed', 'disbursement_requested']
                }
            });

            if (orders.length === 0) {
                return res.status(400).json({ message: 'Tidak ada pesanan valid untuk dicairkan' });
            }

            // Update status ke 'disbursed' untuk semua pesanan terpilih
            await models.orders.update({
                status: 'disbursed',
                disbursement_proof: disbursement_proof || null,
                disbursement_notes: disbursement_notes || null,
                additional_fee: parseInt(additional_fee) || 0,
                disbursed_at: new Date(),
                updated_at: new Date()
            }, {
                where: {
                    id: orders.map(o => o.id)
                }
            });

            // Emit Notifications
            const io = req.app.get('socketio');
            if (io) {
                io.to('admin_room').emit('order_updated_admin', { status: 'disbursed' });

                for (const order of orders) {
                    order.status = 'disbursed';
                    emitOrderUpdated(req, order);

                    const shop = await models.shops.findByPk(order.shop_id);
                    if (shop) {
                        // 1. Save to Database
                        await models.notifications.create({
                            user_id: shop.user_id,
                            type: 'disbursement',
                            title: 'Dana Dicairkan',
                            message: `Dana untuk pesanan ${order.order_id} telah dicairkan. Silakan cek riwayat transaksi.`,
                            link: '/user/toko/pengajuan-keuangan',
                            is_read: false,
                            created_at: new Date()
                        });

                        // 2. Emit Real-time Socket
                        io.to(`user_${shop.user_id}`).emit('new_notification', {
                            type: 'disbursement',
                            title: 'Dana Dicairkan',
                            message: `Dana untuk pesanan ${order.order_id} telah dicairkan. Silakan cek riwayat transaksi.`,
                            link: '/user/toko/pengajuan-keuangan',
                            time: new Date()
                        });
                    }
                }
            }

            return res.status(200).json({
                message: `${orders.length} pesanan berhasil dicairkan sekaligus`,
                count: orders.length
            });
        } catch (err) {
            console.error('bulkDisburseOrders error:', err);
            return res.status(500).json({ message: err.message, detail: err });
        }
    },

    dismissCancellation: async (req, res) => {
        try {
            const { order_id } = req.params;

            // Coba cari berdasarkan Primary Key dulu
            let order = await models.orders.findByPk(order_id).catch(() => null);

            // Jika tidak ketemu, coba cari berdasarkan nomor invoice (string)
            if (!order) {
                order = await models.orders.findOne({
                    where: { order_id: order_id }
                });
            }

            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            await order.update({
                status: 'cancelled_dismissed',
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Fetch current stock to return to frontend for sync
            let currentStock = null;
            if (order.listing_id) {
                const listing = await models.listings.findByPk(order.listing_id);
                if (listing) currentStock = listing.stock;
            }

            return res.status(200).json({
                message: 'Pembatalan berhasil diabaikan',
                currentStock: currentStock
            });
        } catch (err) {
            console.error('dismissCancellation error:', err);
            return res.status(500).json({ message: err.message });
        }
    },

    // GET /orders/refunds - Admin: Ambil semua pengajuan refund
    getAllRefunds: async (req, res) => {
        try {
            const { Op } = require('sequelize');
            const data = await models.orders.findAll({
                where: {
                    status: 'cancelled',
                    refund_status: { [Op.ne]: null }
                },
                include: [
                    {
                        model: models.listings,
                        as: 'product',
                        attributes: ['id', 'product_id', 'name', 'images', 'type', 'species', 'price']
                    },
                    {
                        model: models.shops,
                        as: 'shop',
                        attributes: ['id', 'name', 'city', 'logo_url']
                    },
                    {
                        model: models.users,
                        as: 'user',
                        attributes: ['id', 'username', 'email', 'phone', 'avatar_url', 'bank_accounts']
                    }
                ],
                order: [['cancelled_at', 'DESC'], ['created_at', 'DESC']]
            });

            return res.status(200).json({
                message: 'Data refund berhasil diambil',
                data
            });
        } catch (err) {
            console.error('getAllRefunds error:', err);
            return res.status(500).json({ message: err.message });
        }
    },

    // PUT /orders/:order_id/refund - Admin: Proses refund (kirim uang)
    processRefund: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { refund_proof, refund_notes } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            if (order.status !== 'cancelled') {
                return res.status(400).json({ message: 'Pesanan tidak dalam status dibatalkan' });
            }

            let refundProofUrl = refund_proof || null;

            // Handle direct file upload if present
            if (req.files && (req.files.image || req.files.refund_proof)) {
                const file = req.files.image || req.files.refund_proof;
                
                // Validate size (Max 1MB)
                if (file.size > 1 * 1024 * 1024) {
                    return res.status(400).json({ message: "Ukuran gambar bukti transfer tidak boleh melebihi 1MB" });
                }

                const path = require('path');
                const fs = require('fs');
                const { v4: uuidv4 } = require('uuid');

                const uploadDir = path.join(__dirname, '../../public/uploads');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const ext = path.extname(file.name);
                const filename = `${uuidv4()}${ext}`;
                const uploadPath = path.join(uploadDir, filename);

                await new Promise((resolve, reject) => {
                    file.mv(uploadPath, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                refundProofUrl = `/uploads/${filename}`;
            }

            await order.update({
                refund_proof: refundProofUrl,
                refund_notes: refund_notes || null,
                refunded_at: new Date(),
                refund_status: 'refunded',
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Create notification for the buyer
            try {
                const title = 'Refund Dana Berhasil';
                const message = `Pengembalian dana untuk pesanan ${order.order_id} sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total_price)} telah berhasil diproses oleh Admin.`;
                const newNotif = await models.notifications.create({
                    user_id: order.user_id,
                    type: 'order_buyer',
                    title,
                    message,
                    link: `/user/pesanan/pengembalian-dana`,
                    created_at: new Date()
                });

                const io = req.app.get('socketio');
                if (io) {
                    io.to(`user_${order.user_id}`).emit('new_notification', {
                        id: newNotif.id,
                        type: 'order_buyer',
                        title,
                        message,
                        link: newNotif.link,
                        time: newNotif.created_at
                    });
                }
            } catch (notifErr) {
                console.error("Failed to create refund completion notification:", notifErr);
            }

            return res.status(200).json({
                message: 'Pengembalian dana berhasil diproses',
                data: order
            });
        } catch (err) {
            console.error('processRefund error:', err);
            return res.status(500).json({ message: err.message });
        }
    },

    // PUT /orders/:order_id/reject-refund - Admin: Tolak refund
    rejectRefund: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { refund_notes } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            if (order.status !== 'cancelled') {
                return res.status(400).json({ message: 'Pesanan tidak dalam status dibatalkan' });
            }

            await order.update({
                refund_notes: refund_notes || 'Ditolak oleh admin',
                refund_status: 'rejected',
                updated_at: new Date()
            });

            emitOrderUpdated(req, order);

            // Create notification for the buyer
            try {
                const title = 'Refund Dana Ditolak';
                const message = `Pengembalian dana untuk pesanan ${order.order_id} ditolak oleh Admin. Alasan: ${refund_notes || '-'}`;
                const newNotif = await models.notifications.create({
                    user_id: order.user_id,
                    type: 'order_buyer',
                    title,
                    message,
                    link: `/user/pesanan/pengembalian-dana`,
                    created_at: new Date()
                });

                const io = req.app.get('socketio');
                if (io) {
                    io.to(`user_${order.user_id}`).emit('new_notification', {
                        id: newNotif.id,
                        type: 'order_buyer',
                        title,
                        message,
                        link: newNotif.link,
                        time: newNotif.created_at
                    });
                }
            } catch (notifErr) {
                console.error("Failed to create refund rejection notification:", notifErr);
            }

            return res.status(200).json({
                message: 'Pengembalian dana berhasil ditolak',
                data: order
            });
        } catch (err) {
            console.error('rejectRefund error:', err);
            return res.status(500).json({ message: err.message });
        }
    },

    // PUT /orders/:order_id/request-refund - Buyer: Ajukan refund dengan detail rekening
    requestRefund: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { bank_name, bank_account, bank_holder } = req.body;

            const order = await models.orders.findByPk(order_id);
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            // Verify caller is the owner of the order
            if (order.user_id !== req.user_data.id) {
                return res.status(403).json({ message: 'Anda tidak berwenang untuk mengajukan refund pada pesanan ini' });
            }

            if (order.status !== 'cancelled') {
                return res.status(400).json({ message: 'Pesanan tidak dalam status dibatalkan' });
            }

            await order.update({
                bank_name,
                bank_account,
                bank_holder,
                refund_status: 'pending',
                updated_at: new Date()
            });

            // Helper to emit update via socket if present
            try {
                const io = req.app.get('socketio');
                if (io) {
                    // Notify admins
                    io.to('admin').emit('admin_notification', {
                        type: 'refund_requested',
                        title: 'Pengajuan Refund Baru',
                        message: `Pembeli mengajukan refund untuk pesanan ${order.order_id}`,
                        link: '/admin/pengembalian-dana'
                    });
                    
                    // Also notify general admin room for transactions/orders update
                    io.emit('order_updated_admin', { id: order.id });
                }
            } catch (socketErr) {
                console.error('requestRefund socket emit error:', socketErr);
            }

            return res.status(200).json({
                message: 'Pengajuan refund berhasil dikirim',
                data: order
            });
        } catch (err) {
            console.error('requestRefund error:', err);
            return res.status(500).json({ message: err.message });
        }
    },
    // PUT /orders/:order_id/reset-refund-status - Admin: Reset refund status ke null (untuk testing/koreksi)
    resetRefundStatus: async (req, res) => {
        try {
            const { order_id } = req.params;

            // Cari berdasarkan UUID atau order_id string
            let order = await models.orders.findByPk(order_id).catch(() => null);
            if (!order) {
                order = await models.orders.findOne({ where: { order_id } });
            }
            if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

            await order.update({
                refund_status: null,
                bank_name: null,
                bank_account: null,
                bank_holder: null,
                refund_proof: null,
                refund_notes: null,
                refunded_at: null,
                updated_at: new Date()
            });

            return res.status(200).json({
                message: 'Status refund berhasil direset ke tahap awal',
                data: {
                    id: order.id,
                    order_id: order.order_id,
                    status: order.status,
                    refund_status: order.refund_status
                }
            });
        } catch (err) {
            console.error('resetRefundStatus error:', err);
            return res.status(500).json({ message: err.message });
        }
    }
};

module.exports = OrdersController;
