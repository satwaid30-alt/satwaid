const { Sequelize } = require("sequelize");
const initModels = require("../database/init");
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

module.exports = {
  getBidsByListing: async (req, res) => {
    try {
      const { listing_id } = req.params;

      const bids = await models.bids.findAll({
        where: { listing_id },
        include: [
          {
            model: models.users,
            as: "bidder",
            attributes: ["id", "username", "name", "avatar_url"],
          },
        ],
        order: [
          ["bid_amount", "DESC"],
          ["created_at", "DESC"],
        ],
      });

      return res.status(200).json({ message: "Success", data: bids });
    } catch (error) {
      console.error("Error fetching bids:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  createBid: async (req, res) => {
    try {
      const { listing_id } = req.params;
      const { user_id, bid_amount } = req.body;

      if (!user_id || !bid_amount) {
        return res
          .status(400)
          .json({ message: "User ID dan nominal tawaran wajib diisi" });
      }

      // Fetch listing
      const listing = await models.listings.findByPk(listing_id);
      if (!listing) {
        return res.status(404).json({ message: "Lelang tidak ditemukan" });
      }

      if (listing.type !== "auction") {
        return res
          .status(400)
          .json({ message: "Produk ini bukan produk lelang" });
      }

      // Check if active
      const now = new Date();
      if (listing.start_date && new Date(listing.start_date) > now) {
        return res.status(400).json({ message: "Lelang belum dimulai" });
      }
      if (listing.end_date && new Date(listing.end_date) < now) {
        return res.status(400).json({ message: "Lelang sudah berakhir" });
      }

      if (listing.user_id === user_id) {
        return res
          .status(400)
          .json({ message: "Anda tidak dapat menawar produk Anda sendiri" });
      }

      // Fetch highest bid so far
      const highestBid = await models.bids.findOne({
        where: { listing_id },
        order: [["bid_amount", "DESC"]],
      });

      const baseBid = highestBid
        ? Number(highestBid.bid_amount)
        : Number(listing.start_bid);

      const multiple = Number(listing.multiple) || 0;

      // Calculate minimum allowed bid
      const minBid = highestBid ? baseBid + multiple : baseBid;

      if (Number(bid_amount) < minBid) {
        return res.status(400).json({
          message: `Nominal penawaran terlalu rendah. Penawaran minimal berikutnya adalah Rp ${new Intl.NumberFormat("id-ID").format(minBid)}`,
        });
      }

      // Validate that bid increment is a multiple of listing.multiple
      if (multiple > 0) {
        const increment = Number(bid_amount) - baseBid;
        if (increment % multiple !== 0) {
          return res.status(400).json({
            message: `Nominal penawaran harus berupa kelipatan Rp ${new Intl.NumberFormat("id-ID").format(multiple)} dari penawaran terakhir (${new Intl.NumberFormat("id-ID").format(baseBid)}).`,
          });
        }
      }

      // Create bid
      const newBid = await models.bids.create({
        listing_id,
        user_id,
        bid_amount: parseInt(bid_amount),
      });

      // Fetch with bidder info
      const bidWithBidder = await models.bids.findOne({
        where: { id: newBid.id },
        include: [
          {
            model: models.users,
            as: "bidder",
            attributes: ["id", "username", "name", "avatar_url"],
          },
        ],
      });

      // Trigger dynamic update on socket if registered
      const io = req.app.get("socketio");
      if (io) {
        // Emit in the auction room
        io.to(`auction_${listing_id}`).emit("receive_bid", bidWithBidder);

        // Broadcast global bid update to refresh cards
        io.emit("listing_bid_updated", {
          listing_id,
          current_bid: Number(bid_amount),
        });

        // Create notification for seller
        try {
          const title = "Tawaran Lelang Baru";
          const formattedBid = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(bid_amount);
          const message = `Seseorang telah menawar produk lelang Anda "${listing.name}" seharga ${formattedBid}.`;

          const newNotif = await models.notifications.create({
            user_id: listing.user_id,
            type: "auction_bid",
            title,
            message,
            link: `/toko/detail-lelang/${listing.id}`,
            created_at: new Date(),
          });

          io.to(`user_${listing.user_id}`).emit("new_notification", {
            id: newNotif.id,
            type: "auction_bid",
            title,
            message,
            link: newNotif.link,
            time: newNotif.created_at,
          });
        } catch (notifErr) {
          console.error("Error creating auction bid notification:", notifErr);
        }

        // Create outbid notifications for other unique prior bidders
        try {
          // Fetch all bids for this listing
          const priorBids = await models.bids.findAll({
            where: { listing_id },
            attributes: ["user_id"],
            raw: true,
          });

          // Get unique user_ids who are not the new bidder and not the listing owner
          const uniquePriorBidders = Array.from(
            new Set(
              priorBids
                .map((b) => b.user_id)
                .filter((uId) => uId !== user_id && uId !== listing.user_id),
            ),
          );

          const outbidTitle = "Penawaran Anda Dilompati";
          const formattedBid = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(bid_amount);
          const outbidMessage = `Penawaran Anda untuk "${listing.name}" telah dilompati oleh penawar lain menjadi ${formattedBid}. Silakan pasang penawaran baru!`;

          for (const bidderId of uniquePriorBidders) {
            try {
              const newOutbidNotif = await models.notifications.create({
                user_id: bidderId,
                type: "auction_outbid",
                title: outbidTitle,
                message: outbidMessage,
                link: `/toko/detail-lelang/${listing.id}`,
                created_at: new Date(),
              });

              io.to(`user_${bidderId}`).emit("new_notification", {
                id: newOutbidNotif.id,
                type: "auction_outbid",
                title: outbidTitle,
                message: outbidMessage,
                link: newOutbidNotif.link,
                time: newOutbidNotif.created_at,
              });
            } catch (notifErr) {
              console.error(
                `Error creating auction outbid notification for user ${bidderId}:`,
                notifErr,
              );
            }
          }
        } catch (outbidErr) {
          console.error("Error sending outbid notifications:", outbidErr);
        }
      }

      return res.status(201).json({
        message: "Berhasil memasang penawaran lelang",
        data: bidWithBidder,
      });
    } catch (error) {
      console.error("Error creating bid:", error);
      return res
        .status(500)
        .json({ message: "Internal server error: " + error.message });
    }
  },

  getUserBids: async (req, res) => {
    try {
      const { user_id } = req.params;
      const { Op } = require("sequelize");

      // Validate user_id UUID format to prevent PostgreSQL syntax error (22P02)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!user_id || !uuidRegex.test(user_id)) {
        return res.status(200).json({ message: "Success", data: [] });
      }

      // 1. Get unique listing_ids where the user has bid
      //    Use raw SQL to avoid Sequelize auto-injecting 'bids.id' into SELECT
      //    which breaks PostgreSQL GROUP BY
      const userBids = await sequelize.query(
        `SELECT "listing_id", MAX("bid_amount") AS "user_max_bid"
         FROM "bids"
         WHERE "user_id" = :user_id
         GROUP BY "listing_id"`,
        {
          replacements: { user_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (!userBids || userBids.length === 0) {
        return res.status(200).json({ message: "Success", data: [] });
      }

      const listingIds = userBids.map((b) => b.listing_id);

      // 2. Fetch those listings with shop information and statistics
      const listings = await models.listings.findAll({
        where: {
          id: { [Op.in]: listingIds },
          status: { [Op.notIn]: ["deleted", "Deleted"] },
        },
        include: [
          {
            model: models.shops,
            as: "shop",
            attributes: ["id", "name", "logo_url"],
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(`(
                SELECT COALESCE(MAX(bid_amount), "listings"."start_bid")
                FROM bids
                WHERE bids.listing_id = "listings"."id"
              )`),
              "current_bid",
            ],
            [
              Sequelize.literal(`(
                SELECT COUNT(*)
                FROM bids
                WHERE bids.listing_id = "listings"."id"
              )`),
              "bid_count",
            ],
            [
              Sequelize.literal(`(
                SELECT user_id
                FROM bids
                WHERE bids.listing_id = "listings"."id"
                ORDER BY bid_amount DESC, created_at DESC
                LIMIT 1
              )`),
              "highest_bidder_id",
            ],
          ],
        },
        order: [["created_at", "DESC"]],
      });

      // 3. Map user_max_bid and highest bidder info to listings data
      const data = listings.map((listing) => {
        const json = listing.toJSON();
        const userBid = userBids.find((b) => b.listing_id === json.id);
        json.user_max_bid = userBid ? parseInt(userBid.user_max_bid) : 0;
        json.current_bid = parseInt(json.current_bid);
        json.bid_count = parseInt(json.bid_count);

        const isHighest = json.highest_bidder_id === user_id;
        const isEnded =
          json.status === "ended" ||
          json.status === "sold" ||
          (json.end_date && new Date(json.end_date) <= new Date());

        if (isEnded) {
          json.user_status = isHighest ? "won" : "lost";
        } else {
          json.user_status = isHighest ? "highest" : "outbid";
        }

        return json;
      });

      return res.status(200).json({ message: "Success", data });
    } catch (error) {
      console.error("Error fetching user bids:", error);
      return res
        .status(500)
        .json({ message: "Internal server error: " + error.message });
    }
  },
};
