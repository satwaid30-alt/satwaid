const http = require('http');
// Force nodemon reload trigger: 2026-06-04T16:50:00
const app = require('./app');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// JWT Middleware for Socket.IO Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    
    if (token) {
        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
        jwt.verify(tokenString, process.env.JWT_CONF_TOKEN, (err, decoded) => {
            if (err) {
                // Token invalid/expired — allow as guest so public real-time events still work
                console.warn(`[Socket Auth] Invalid/expired token for socket ${socket.id}: ${err.message}. Allowing as guest.`);
                socket.user = null;
                return next();
            }
            socket.user = decoded;
            console.log(`[Socket Auth] Authenticated user ${decoded.username} (ID: ${decoded.id}, Role: ${decoded.role}) on socket ${socket.id}`);
            return next();
        });
    } else {
        // Allow guest connection (for public views)
        socket.user = null;
        console.log(`[Socket Auth] Guest connection allowed on socket ${socket.id}`);
        return next();
    }
});

// Expose io to routes
app.set('socketio', io);

const { Sequelize } = require('sequelize');
const initModels = require('./app/database/init');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

// Run one-off database correction for test data
(async () => {
    try {
        await sequelize.query(`
            UPDATE public.complaint_comments cc
            SET user_id = c.user_id
            FROM public.complaints c
            WHERE cc.complaint_id = c.id
              AND cc.content = 'coba min di cek lagi masih error sama';
        `);
        await sequelize.query(`
            UPDATE public.users
            SET name = 'Admin SatwaiD'
            WHERE username = 'admin';
        `);
        console.log(`[DB Fix] Corrected test complaint comments and updated admin name successfully.`);
    } catch (err) {
        console.error(`[DB Fix] Error running database corrections:`, err);
    }
})();


// Function to automatically check and complete shipped orders after 2 days (48 hours)
async function autoCheckShippedOrders() {
    try {
        const { Op } = require('sequelize');
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 48 Hours

        const ordersToComplete = await models.orders.findAll({
            where: {
                status: 'shipped',
                shipped_at: {
                    [Op.lte]: twoDaysAgo
                }
            }
        });

        if (ordersToComplete && ordersToComplete.length > 0) {
            console.log(`[Auto-Complete] Found ${ordersToComplete.length} shipped orders older than 48 hours.`);

            for (const order of ordersToComplete) {
                // 1. Update listing status to 'sold' if stock <= 0
                if (order.listing_id) {
                    const listing = await models.listings.findByPk(order.listing_id);
                    if (listing) {
                        const otherActiveOrders = await models.orders.count({
                            where: {
                                listing_id: order.listing_id,
                                id: { [Op.ne]: order.id },
                                status: { [Op.notIn]: ['completed', 'cancelled', 'complained'] }
                            }
                        });

                        if (listing.stock <= 0 && otherActiveOrders === 0) {
                            await listing.update({
                                status: 'sold',
                                sold_at: new Date(),
                                updated_at: new Date()
                            });

                            await models.carts.destroy({
                                where: { listing_id: order.listing_id }
                            });
                        }
                    }
                }

                // 2. Update order state to completed (auto 5-star rating & review)
                await order.update({
                    status: 'completed',
                    rating: 5,
                    review: "Sistem Otomatis: Bintang 5 diberikan karena pesanan selesai otomatis dalam 2 hari.",
                    completed_at: new Date(),
                    updated_at: new Date()
                });

                console.log(`[Auto-Complete] Order ${order.order_id} has been automatically marked as completed.`);

                // 3. Send notification to seller
                const shop = await models.shops.findByPk(order.shop_id);
                if (shop) {
                    const title = 'Transaksi Selesai (Otomatis)';
                    const message = `Sistem telah otomatis mengonfirmasi penerimaan barang untuk pesanan ${order.order_id} karena sudah 2 hari sejak pengiriman. Dana akan segera diproses ke saldo Anda.`;

                    const newNotif = await models.notifications.create({
                        user_id: shop.user_id,
                        type: 'order_completed',
                        title,
                        message,
                        link: '/user/toko/dashboard',
                        created_at: new Date()
                    });

                    // 4. Send socket events
                    if (io) {
                        // Notify order room
                        io.to(`order_${order.id}`).emit('order_updated', { order_id: order.id, status: order.status });

                        // Notify admin
                        io.to('admin_room').emit('order_updated_admin', { order_id: order.order_id, status: order.status });

                        // Notify seller
                        io.to(`user_${shop.user_id}`).emit('new_notification', {
                            id: newNotif.id,
                            type: 'order_completed',
                            title,
                            message,
                            time: newNotif.created_at
                        });

                        // Notify buyer
                        io.to(`user_${order.user_id}`).emit('new_notification', {
                            id: newNotif.id,
                            type: 'order_buyer',
                            title: 'Pesanan Selesai (Otomatis)',
                            message: `Pesanan ${order.order_id} telah otomatis dinyatakan selesai oleh sistem setelah 2 hari pengiriman.`,
                            link: `/user/pesanan/transaksi-selesai/${order.id}`,
                            time: new Date()
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Auto-Complete Error]:', error);
    }
}

// Function to automatically close expired auctions and create orders/notifications
async function autoCloseExpiredAuctions() {
    try {
        const { Op } = require('sequelize');
        const now = new Date();

        // Find all active auctions that have expired
        const expiredAuctions = await models.listings.findAll({
            where: {
                type: 'auction',
                status: 'active',
                end_date: {
                    [Op.lte]: now
                }
            }
        });

        if (expiredAuctions && expiredAuctions.length > 0) {
            console.log(`[Auto-Close-Auction] Found ${expiredAuctions.length} expired active auctions.`);

            for (const expiredAuction of expiredAuctions) {
                const transaction = await sequelize.transaction();
                try {
                    // Lock and re-verify status
                    const listing = await models.listings.findByPk(expiredAuction.id, {
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });

                    if (!listing || listing.status !== 'active') {
                        await transaction.rollback();
                        continue;
                    }

                    const shop = await models.shops.findByPk(listing.shop_id, { transaction });
                    const sellerUserId = shop ? shop.user_id : null;

                    const highestBid = await models.bids.findOne({
                        where: { listing_id: listing.id },
                        order: [['bid_amount', 'DESC']],
                        transaction
                    });

                    let winnerId = null;
                    let createdOrderUuid = null;
                    let createdOrderId = null;
                    let finalPrice = null;
                    let winnerNotifData = null;
                    let sellerNotifData = null;

                    if (highestBid) {
                        winnerId = highestBid.user_id;
                        finalPrice = Number(highestBid.bid_amount);

                        const existingOrder = await models.orders.findOne({
                            where: { listing_id: listing.id },
                            transaction
                        });

                        if (!existingOrder) {
                            const ShortUniqueId = require('short-unique-id');
                            const uid = new ShortUniqueId({ length: 6, dictionary: 'number' });
                            const dateStr = now.getFullYear().toString() +
                                String(now.getMonth() + 1).padStart(2, '0') +
                                String(now.getDate()).padStart(2, '0');
                            const orderId = `INV/${dateStr}/RH/${uid.rnd()}`;
                            const ADMIN_FEE = 5000;

                            const productPrice = Number(highestBid.bid_amount);
                            const totalPrice = productPrice + ADMIN_FEE;

                            const newOrder = await models.orders.create({
                                order_id: orderId,
                                user_id: highestBid.user_id,
                                listing_id: listing.id,
                                shop_id: listing.shop_id,
                                quantity: 1,
                                price: productPrice,
                                admin_fee: ADMIN_FEE,
                                total_price: totalPrice,
                                status: 'pending_shipping_info'
                            }, { transaction });

                            createdOrderId = orderId;
                            createdOrderUuid = newOrder.id;

                            await listing.update({
                                status: 'ended',
                                stock: 0,
                                updated_at: new Date()
                            }, { transaction });
                        } else {
                            createdOrderId = existingOrder.order_id;
                            createdOrderUuid = existingOrder.id;

                            await listing.update({
                                status: 'ended',
                                updated_at: new Date()
                            }, { transaction });
                        }

                        const formattedBid = new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                        }).format(finalPrice);

                        // Winner Notif
                        winnerNotifData = await models.notifications.create({
                            user_id: winnerId,
                            type: 'order_buyer',
                            title: 'Anda Memenangkan Lelang!',
                            message: `Selamat! Anda memenangkan lelang untuk "${listing.name}" seharga ${formattedBid}. Silakan lengkapi data pengiriman untuk memproses transaksi.`,
                            link: `/user/pesanan/transaksi/${createdOrderUuid}`,
                            created_at: new Date()
                        }, { transaction });

                        // Seller Notif
                        if (sellerUserId) {
                            sellerNotifData = await models.notifications.create({
                                user_id: sellerUserId,
                                type: 'order_seller',
                                title: 'Lelang Selesai - Ada Pemenang',
                                message: `Lelang Anda untuk "${listing.name}" telah berakhir. Pemenang telah ditentukan seharga ${formattedBid}. Menunggu pembeli melengkapi alamat.`,
                                link: `/user/toko/pesanan-masuk/detail/${createdOrderUuid}`,
                                created_at: new Date()
                            }, { transaction });
                        }
                    } else {
                        await listing.update({
                            status: 'ended',
                            updated_at: new Date()
                        }, { transaction });

                        // Seller Notif (no bids)
                        if (sellerUserId) {
                            sellerNotifData = await models.notifications.create({
                                user_id: sellerUserId,
                                type: 'order_seller',
                                title: 'Lelang Berakhir Tanpa Penawaran',
                                message: `Lelang Anda untuk "${listing.name}" telah berakhir tanpa adanya penawaran.`,
                                link: '/user/toko/daftar-produk',
                                created_at: new Date()
                            }, { transaction });
                        }
                    }

                    await transaction.commit();
                    console.log(`[Auto-Close-Auction] Successfully closed auction ${listing.id}.`);

                    // Emit Socket.IO Events
                    if (io) {
                        io.to(`auction_${listing.id}`).emit('auction_ended', {
                            listing_id: listing.id,
                            order_id: createdOrderId,
                            order_uuid: createdOrderUuid,
                            winner_id: winnerId,
                            ended_at: new Date().toISOString()
                        });

                        io.emit('listing_status_updated', {
                            listing_id: listing.id,
                            status: 'ended'
                        });

                        if (winnerId && winnerNotifData) {
                            io.to(`user_${winnerId}`).emit('new_notification', {
                                id: winnerNotifData.id,
                                type: winnerNotifData.type,
                                title: winnerNotifData.title,
                                message: winnerNotifData.message,
                                link: winnerNotifData.link,
                                time: winnerNotifData.created_at
                            });
                        }

                        if (sellerUserId && sellerNotifData) {
                            io.to(`user_${sellerUserId}`).emit('new_notification', {
                                id: sellerNotifData.id,
                                type: sellerNotifData.type,
                                title: sellerNotifData.title,
                                message: sellerNotifData.message,
                                link: sellerNotifData.link,
                                time: sellerNotifData.created_at
                            });
                        }
                    }

                } catch (err) {
                    await transaction.rollback();
                    console.error(`[Auto-Close-Auction Error] Failed processing auction ${expiredAuction.id}:`, err);
                }
            }
        }
    } catch (err) {
        console.error('[Auto-Close-Auction Error]:', err);
    }
}

sequelize.sync({ alter: true })
    .then(async () => {
        console.log('Database synced successfully (alter: true)');
        try {
            await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "payment_rejection_reason" TEXT;');
            console.log('Payment rejection reason column verified/added successfully.');
            
            // Add refund and bank columns if not exists
            await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "bank_name" VARCHAR(100) DEFAULT NULL;');
            await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "bank_account" VARCHAR(100) DEFAULT NULL;');
            await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "bank_holder" VARCHAR(100) DEFAULT NULL;');
            await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "refund_status" VARCHAR(30) DEFAULT NULL;');
            await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "refund_proof" VARCHAR(255) DEFAULT NULL;');
            await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "refund_notes" TEXT DEFAULT NULL;');
            await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "refunded_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL;');
            console.log('Refund and bank columns verified/added successfully.');

            // Clean up any historical default 'pending' refund statuses where the buyer has not yet requested it (bank details are null)
            await sequelize.query('UPDATE "public"."orders" SET "refund_status" = NULL WHERE "refund_status" = \'pending\' AND "bank_account" IS NULL;');
            console.log('Cleaned up un-submitted refund statuses to NULL successfully.');
        } catch (err) {
            console.error('Error altering/cleaning orders table manually:', err.message);
        }


        // Run auto check for shipped orders and auctions on startup
        autoCheckShippedOrders();
        autoCloseExpiredAuctions();
        // Set interval to run every 60 seconds for shipped orders
        setInterval(autoCheckShippedOrders, 60 * 1000);
        // Set interval to run every 5 seconds for expired auctions
        setInterval(autoCloseExpiredAuctions, 5 * 1000);
    })
    .catch(err => console.error('Error syncing database:', err));

io.on('connection', (socket) => {
    console.log('A user connected via socket:', socket.id);

    // Join room berdasarkan topic_id
    socket.on('join_topic', (topicId) => {
        socket.join(topicId);
        console.log(`Socket ${socket.id} joined topic ${topicId}`);
    });

    // Join room berdasarkan user_id untuk notifikasi global
    socket.on('join_user', (userId) => {
        if (!socket.user || String(socket.user.id) !== String(userId)) {
            console.warn(`[Socket Auth Warning] Unauthorized join_user attempt by socket ${socket.id} (user: ${socket.user?.username || 'Guest'}) for room user_${userId}`);
            return;
        }
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined user room user_${userId}`);
    });

    // Join room khusus admin untuk update real-time dashboard admin
    socket.on('join_admin', () => {
        if (!socket.user || socket.user.role !== 'admin') {
            console.warn(`[Socket Auth Warning] Unauthorized join_admin attempt by socket ${socket.id} (user: ${socket.user?.username || 'Guest'})`);
            return;
        }
        socket.join('admin_room');
        console.log(`Socket ${socket.id} joined admin_room`);
    });

    // Join room lelang berdasarkan listing_id untuk live bidding
    socket.on('join_auction', (listingId) => {
        socket.join(`auction_${listingId}`);
        console.log(`Socket ${socket.id} joined auction room auction_${listingId}`);
    });

    // Join room order berdasarkan order_uuid (UUID) untuk pembaruan real-time proses transaksi
    socket.on('join_order', (orderId) => {
        socket.join(`order_${orderId}`);
        console.log(`Socket ${socket.id} joined order room order_${orderId}`);
    });

    // Join room pengaduan berdasarkan complaint_id untuk live chat pengaduan
    socket.on('join_complaint', (complaintId) => {
        socket.join(`complaint_${complaintId}`);
        console.log(`Socket ${socket.id} joined complaint room complaint_${complaintId}`);
    });

    // Menerima komentar/chat baru pada PENGADUAN
    socket.on('send_complaint_comment', async (data) => {
        try {
            const { complaint_id, user_id, content } = data;

            if (!socket.user || String(socket.user.id).toLowerCase() !== String(user_id).toLowerCase()) {
                console.warn(`[Socket Auth Warning] Unauthorized send_complaint_comment attempt by socket ${socket.id} claiming user_id ${user_id}`);
                return;
            }

            // Verify if user is owner of the complaint or an admin
            const complaint = await models.complaints.findByPk(complaint_id);
            if (!complaint) {
                console.warn(`[Socket Error] Complaint ${complaint_id} not found`);
                return;
            }

            if (socket.user.role !== 'admin' && String(complaint.user_id).toLowerCase() !== String(user_id).toLowerCase()) {
                console.warn(`[Socket Auth Warning] Unauthorized access to complaint ${complaint_id} comments by user ${user_id}`);
                return;
            }

            // Simpan ke DB Komentar Pengaduan (Tabel complaint_comments)
            const newComment = await models.complaint_comments.create({
                complaint_id,
                user_id,
                content
            });

            // Ambil data lengkap dengan relasi author
            const commentWithAuthor = await models.complaint_comments.findOne({
                where: { id: newComment.id },
                include: [{
                    model: models.users,
                    as: 'author',
                    attributes: ['id', 'username', 'name', 'avatar_url', 'role']
                }]
            });

            // Broadcast ke room complaint
            io.to(`complaint_${complaint_id}`).emit('receive_complaint_comment', commentWithAuthor);

            // Buat & Kirim notifikasi
            const senderName = commentWithAuthor.author?.name || commentWithAuthor.author?.username || 'Seseorang';
            const shortContent = content.length > 50 ? content.substring(0, 50) + "..." : content;

            if (socket.user.role === 'admin') {
                // Sent by admin -> notify user
                const title = 'Balasan Pengaduan Baru';
                const message = `Admin membalas pengaduan Anda "${complaint.title}": "${shortContent}"`;
                const link = '/user/pengaduan';

                const newNotif = await models.notifications.create({
                    user_id: complaint.user_id,
                    type: 'complaint',
                    title,
                    message,
                    link,
                    created_at: new Date()
                });

                io.to(`user_${complaint.user_id}`).emit('new_notification', {
                    id: newNotif.id,
                    type: 'complaint',
                    title,
                    message,
                    link,
                    time: newNotif.created_at
                });
            } else {
                // Sent by user -> notify admin room
                const title = 'Pesan Pengaduan Baru';
                const message = `${senderName} membalas pengaduan: "${shortContent}"`;

                // Broadcast to admin_room to show a toast/badge
                io.to('admin_room').emit('new_complaint_comment', {
                    complaint_id,
                    title,
                    message,
                    sender_name: senderName
                });
            }

            // Broadcast count update to user and admin rooms
            io.to(`user_${complaint.user_id}`).emit('complaint_comment_added', { complaint_id });
            io.to('admin_room').emit('complaint_comment_added', { complaint_id });

        } catch (error) {
            console.error("Error processing complaint comment:", error);
        }
    });

    // Menerima komentar baru pada TOPIK (Komunitas)
    socket.on('send_comment', async (data) => {
        try {
            const { topic_id, user_id, content } = data;

            if (!socket.user || String(socket.user.id).toLowerCase() !== String(user_id).toLowerCase()) {
                console.warn(`[Socket Auth Warning] Unauthorized send_comment attempt by socket ${socket.id} claiming user_id ${user_id}`);
                return;
            }

            // Simpan ke DB Komentar (Tabel comments)
            const newComment = await models.comments.create({
                topic_id,
                user_id,
                content
            });

            // Ambil data lengkap dengan relasi author
            const commentWithAuthor = await models.comments.findOne({
                where: { id: newComment.id },
                include: [{
                    model: models.users,
                    as: 'author',
                    attributes: ['id', 'username', 'name', 'avatar_url']
                }]
            });

            // Broadcast ke room topic
            io.to(topic_id).emit('receive_comment', commentWithAuthor);

            // Kirim & Simpan notifikasi ke pembuat topik dan semua partisipan yang pernah berkomentar
            const topic = await models.topics.findByPk(topic_id);
            if (topic) {
                // Ambil semua komentator unik di topik ini
                const commenters = await models.comments.findAll({
                    where: { topic_id },
                    attributes: ['user_id'],
                    raw: true
                });

                const participantIds = new Set();
                // Tambahkan pembuat topik jika bukan orang yang berkomentar saat ini
                if (topic.user_id !== user_id) {
                    participantIds.add(topic.user_id);
                }
                // Tambahkan semua komentator jika bukan orang yang berkomentar saat ini
                commenters.forEach(c => {
                    if (c.user_id !== user_id) {
                        participantIds.add(c.user_id);
                    }
                });

                // Buat notifikasi untuk setiap partisipan
                const commenterName = commentWithAuthor.author?.name || commentWithAuthor.author?.username || 'Seseorang';
                const title = 'Komentar Baru';
                const link = `/komunitas/${topic_id}`;

                for (const participantId of participantIds) {
                    const message = participantId === topic.user_id
                        ? `${commenterName} membalas diskusi Anda: "${topic.title}"`
                        : `${commenterName} membalas diskusi "${topic.title}"`;

                    // Simpan ke database
                    const newNotif = await models.notifications.create({
                        user_id: participantId,
                        type: 'community',
                        title,
                        message,
                        link,
                        created_at: new Date()
                    });

                    // Emit melalui Socket.io
                    io.to(`user_${participantId}`).emit('new_notification', {
                        id: newNotif.id,
                        type: 'community',
                        title,
                        message,
                        link,
                        time: newNotif.created_at
                    });
                }
            }
        } catch (error) {
            console.error("Error processing topic comment:", error);
        }
    });

    // Menerima penawaran lelang baru (live bid)
    socket.on('send_bid', async (data) => {
        try {
            const { listing_id, user_id, bid_amount } = data;

            if (!socket.user || String(socket.user.id).toLowerCase() !== String(user_id).toLowerCase()) {
                console.warn(`[Socket Auth Warning] Unauthorized send_bid attempt by socket ${socket.id} claiming user_id ${user_id}`);
                return;
            }

            // Fetch listing
            const listing = await models.listings.findByPk(listing_id);
            if (!listing || listing.type !== 'auction') return;

            // Check highest bid so far
            const highestBid = await models.bids.findOne({
                where: { listing_id },
                order: [['bid_amount', 'DESC']]
            });

            const baseBid = highestBid
                ? Number(highestBid.bid_amount)
                : Number(listing.start_bid);

            const multiple = Number(listing.multiple) || 0;

            // Calculate minimum allowed bid
            const minBid = highestBid
                ? baseBid + multiple
                : baseBid;

            if (Number(bid_amount) < minBid) {
                console.log(`[Socket Bid Error] Bid amount ${bid_amount} is less than min bid ${minBid}`);
                return;
            }

            // Validate multiple
            if (multiple > 0) {
                const increment = Number(bid_amount) - baseBid;
                if (increment % multiple !== 0) {
                    console.log(`[Socket Bid Error] Bid amount ${bid_amount} is not a multiple of ${multiple} relative to base ${baseBid}`);
                    return;
                }
            }

            // Create bid
            const newBid = await models.bids.create({
                listing_id,
                user_id,
                bid_amount: parseInt(bid_amount)
            });

            // Fetch with bidder info
            const bidWithBidder = await models.bids.findOne({
                where: { id: newBid.id },
                include: [{
                    model: models.users,
                    as: 'bidder',
                    attributes: ['id', 'username', 'name', 'avatar_url']
                }]
            });

            // Broadcast to auction room
            io.to(`auction_${listing_id}`).emit('receive_bid', bidWithBidder);

            // Broadcast global bid update to refresh cards
            io.emit('listing_bid_updated', {
                listing_id,
                current_bid: Number(bid_amount)
            });

            // Create notification for seller
            try {
                const title = 'Tawaran Lelang Baru';
                const formattedBid = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bid_amount);
                const message = `Seseorang telah menawar produk lelang Anda "${listing.name}" seharga ${formattedBid}.`;
                
                const newNotif = await models.notifications.create({
                    user_id: listing.user_id,
                    type: 'auction_bid',
                    title,
                    message,
                    link: `/toko/detail-lelang/${listing.id}`,
                    created_at: new Date()
                });

                io.to(`user_${listing.user_id}`).emit('new_notification', {
                    id: newNotif.id,
                    type: 'auction_bid',
                    title,
                    message,
                    link: newNotif.link,
                    time: newNotif.created_at
                });
            } catch (notifErr) {
                console.error("Error creating auction bid notification via socket:", notifErr);
            }
        } catch (error) {
            console.error("Error processing live bid socket:", error);
        }
    });

    // Menerima pesan CHAT pribadi (Private Message)
    socket.on('send_message', async (data) => {

        try {
            const { chat_id, user_id, content } = data;

            if (!socket.user || String(socket.user.id).toLowerCase() !== String(user_id).toLowerCase()) {
                console.warn(`[Socket Auth Warning] Unauthorized send_message attempt by socket ${socket.id} claiming user_id ${user_id}`);
                return;
            }

            // Additionally check if user is a participant in this chat
            const chat = await models.chats.findByPk(chat_id);
            if (!chat || (String(socket.user.id).toLowerCase() !== String(chat.buyer_id).toLowerCase() && String(socket.user.id).toLowerCase() !== String(chat.seller_id).toLowerCase())) {
                console.warn(`[Socket Auth Warning] Unauthorized send_message in chat ${chat_id} by user ${socket.user.id}`);
                return;
            }

            // Simpan ke DB Pesan Chat (Tabel chat_messages)
            const newMessage = await models.chat_messages.create({
                chat_id,
                sender_id: user_id,
                content
            });

            // Ambil data lengkap dengan relasi sender
            const messageWithSender = await models.chat_messages.findOne({
                where: { id: newMessage.id },
                include: [{
                    model: models.users,
                    as: 'sender',
                    attributes: ['id', 'username', 'name', 'avatar_url']
                }]
            });

            // Broadcast ke room chat
            io.to(chat_id).emit('receive_message', messageWithSender);

            // Update timestamp di tabel chats
            if (chat) {
                const recipientId = (user_id == chat.buyer_id) ? chat.seller_id : chat.buyer_id;

                if (recipientId) {
                    io.to(`user_${recipientId}`).emit('new_notification', {
                        type: 'chat',
                        chat_id: chat_id,
                        product_id: chat.listing_id,
                        sender_name: messageWithSender.sender?.name || messageWithSender.sender?.username,
                        content: content.substring(0, 50),
                        time: new Date(),
                        link: 'chat_modal',
                        data: {
                            topicId: chat_id,
                            sellerId: chat.seller_id,
                            buyerId: chat.buyer_id,
                            productId: chat.listing_id
                        }
                    });
                }

                await chat.update({ updated_at: new Date() });
            }
        } catch (error) {
            console.error("Error processing private message:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.info(`Server (with Socket.IO) listening on port ${PORT}`);
});