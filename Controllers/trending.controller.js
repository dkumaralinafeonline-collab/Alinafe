// src/controllers/trending.controller.js
import Ad from "../models/Ad.js";

export const getTrendingAds = async (req, res) => {
  try {
    /* =================================================
       1️⃣ READ VALIDATED QUERY (NODE 24 SAFE)
    ================================================= */
    const {
      lat,
      lng,
      city,
      limit = 10,
    } = req.validated?.query || {};

    const safeLimit = Number(limit) || 10;

    let ads = [];

    /* =================================================
       2️⃣ TRY GEO-BASED TRENDING (PRIMARY)
    ================================================= */
    if (lat != null && lng != null) {
      const geoPipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat],
            },
            distanceField: "distance",
            maxDistance: 15000, // 15 km
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
       3️⃣ FALLBACK → CITY BASED (IF GEO EMPTY)
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
    return res.json(ads);
  } catch (err) {
    console.error("❌ Trending Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
