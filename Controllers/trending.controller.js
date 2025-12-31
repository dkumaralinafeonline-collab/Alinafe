// src/controllers/trending.controller.js
import Ad from "../models/Ad.js";

export const getTrendingAds = async (req, res) => {
  try {
    /* =================================================
       1️⃣ READ VALIDATED QUERY (SAFE)
       (validate middleware already applied in routes)
    ================================================= */
    const {
      lat,
      lng,
      city,
      limit = 10,
    } = req.validated?.query || {};

    const safeLimit = Math.min(Number(limit) || 10, 50); // ⛔ hard cap

    let ads = [];

    /* =================================================
       2️⃣ GEO-BASED TRENDING (PRIMARY)
       (Only if lat & lng provided)
    ================================================= */
    if (
      typeof lat === "number" &&
      typeof lng === "number"
    ) {
      const geoPipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat],
            },
            distanceField: "distance",
            maxDistance: 15000, // 15 KM
            spherical: true,
            query: { status: "Approved" },
          },
        },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ["$views", 1] },
                { $multiply: ["$favouritesCount", 2] },
                {
                  $divide: [
                    1,
                    {
                      $add: [
                        {
                          $divide: [
                            { $subtract: [new Date(), "$createdAt"] },
                            1000 * 60 * 60 * 24,
                          ],
                        },
                        1,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        { $sort: { trendingScore: -1, createdAt: -1 } },
        { $limit: safeLimit },
        {
          $project: {
            title: 1,
            price: 1,
            city: 1,
            images: { $slice: ["$images", 1] },
            createdAt: 1,
          },
        },
      ];

      ads = await Ad.aggregate(geoPipeline);
    }

    /* =================================================
       3️⃣ FALLBACK → CITY BASED
       (If geo empty or not available)
    ================================================= */
    if (ads.length === 0 && city) {
      const cityPipeline = [
        {
          $match: {
            city: new RegExp(`^${city}$`, "i"),
            status: "Approved",
          },
        },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ["$views", 1] },
                { $multiply: ["$favouritesCount", 2] },
                {
                  $divide: [
                    1,
                    {
                      $add: [
                        {
                          $divide: [
                            { $subtract: [new Date(), "$createdAt"] },
                            1000 * 60 * 60 * 24,
                          ],
                        },
                        1,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        { $sort: { trendingScore: -1, createdAt: -1 } },
        { $limit: safeLimit },
        {
          $project: {
            title: 1,
            price: 1,
            city: 1,
            images: { $slice: ["$images", 1] },
            createdAt: 1,
          },
        },
      ];

      ads = await Ad.aggregate(cityPipeline);
    }

    /* =================================================
       4️⃣ FINAL FALLBACK → GLOBAL TRENDING
    ================================================= */
    if (ads.length === 0) {
      const globalPipeline = [
        { $match: { status: "Approved" } },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ["$views", 1] },
                { $multiply: ["$favouritesCount", 2] },
                {
                  $divide: [
                    1,
                    {
                      $add: [
                        {
                          $divide: [
                            { $subtract: [new Date(), "$createdAt"] },
                            1000 * 60 * 60 * 24,
                          ],
                        },
                        1,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        { $sort: { trendingScore: -1, createdAt: -1 } },
        { $limit: safeLimit },
        {
          $project: {
            title: 1,
            price: 1,
            city: 1,
            images: { $slice: ["$images", 1] },
            createdAt: 1,
          },
        },
      ];

      ads = await Ad.aggregate(globalPipeline);
    }

    /* =================================================
       5️⃣ RESPONSE
    ================================================= */
    return res.status(200).json(ads);
  } catch (err) {
    console.error("❌ Trending Error:", err);
    return res.status(500).json({
      message: "Server error while fetching trending ads",
    });
  }
};
