const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Expose io to routes
app.set('socketio', io);

const { Sequelize } = require('sequelize');
const initModels = require('./app/database/init');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);
sequelize.sync({ alter: true })
    .then(() => console.log('Database synced successfully (alter: true)'))
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
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined user room user_${userId}`);
    });

    // Join room khusus admin untuk update real-time dashboard admin
    socket.on('join_admin', () => {
        socket.join('admin_room');
        console.log(`Socket ${socket.id} joined admin_room`);
    });

    // Menerima komentar baru pada TOPIK (Komunitas)
    socket.on('send_comment', async (data) => {
        try {
            const { topic_id, user_id, content } = data;
            
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

            // Opsional: Kirim notifikasi ke pembuat topik
            const topic = await models.topics.findByPk(topic_id);
            if (topic && topic.user_id !== user_id) {
                io.to(`user_${topic.user_id}`).emit('new_notification', {
                    type: 'community',
                    title: 'Komentar Baru',
                    message: `${commentWithAuthor.author?.name || commentWithAuthor.author?.username} membalas diskusi Anda.`,
                    link: `/komunitas/${topic_id}`,
                    time: new Date()
                });
            }
        } catch (error) {
            console.error("Error processing topic comment:", error);
        }
    });

    // Menerima pesan CHAT pribadi (Private Message)
    socket.on('send_message', async (data) => {
        try {
            const { chat_id, user_id, content } = data;
            
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
            const chat = await models.chats.findByPk(chat_id);
            
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