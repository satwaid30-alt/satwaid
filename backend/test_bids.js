const { Sequelize } = require("sequelize");
require("dotenv").config();
const initModels = require("./app/database/init");

async function test() {
  const sequelize = new Sequelize(process.env.DATABASE_URL);
  const models = initModels(sequelize);

  try {
    // Find a user who has placed bids
    const sampleBid = await models.bids.findOne({
      attributes: ["user_id"],
    });

    if (!sampleBid) {
      console.log(
        "No bids found in database. Cannot run verification. This is fine if db is empty.",
      );
      return;
    }

    const user_id = sampleBid.user_id;
    console.log("Testing with user_id:", user_id);

    const { Op } = require("sequelize");

    // 1. Get unique listing_ids where the user has bid
    const userBids = await models.bids.findAll({
      where: { user_id },
      attributes: [
        "listing_id",
        [Sequelize.fn("MAX", Sequelize.col("bid_amount")), "user_max_bid"],
      ],
      group: ["listing_id"],
      raw: true,
    });

    console.log("userBids retrieved:", userBids);

    if (!userBids || userBids.length === 0) {
      console.log("No bids for this user.");
      return;
    }

    const listingIds = userBids.map((b) => b.listing_id);

    // 2. Fetch listings
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

    console.log(`Retrieved ${listings.length} listings:`);
    listings.forEach((listing) => {
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

      console.log(
        `- [${json.user_status}] Name: ${json.name}, User Bid: ${json.user_max_bid}, Current Bid: ${json.current_bid}, Total Bids: ${json.bid_count}`,
      );
    });
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await sequelize.close();
  }
}

test();
