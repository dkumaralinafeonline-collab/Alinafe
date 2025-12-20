export const trendingScoreStage = {
    $addFields: {
      trendingScore: {
        $add: [
          { $multiply: ["$views", 1] },
          { $multiply: ["$likes", 3] },
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
  };
  