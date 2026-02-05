// Configuration for Time-Aware Ranking

export const TEMPORAL_RULES = {
    entertainment: {
        high_weight_days: [4, 5, 6], // Thu, Fri, Sat (0=Sun, 1=Mon... 4=Thu, 5=Fri, 6=Sat)
        high_weight_multiplier: 1.5,
        normal_multiplier: 1.0,
        recency_decay_hours: 24,
        minimum_metascore: 75,
        priority_metascore: 80
    },
    shopping: {
        high_intensity_days: [1, 2, 3, 4, 5, 25, 26, 27, 28, 29, 30, 31], // Beginning and End of month (Payday)
        high_intensity_multiplier: 1.3,
        minimum_discount_percent: 40,
        keywords_boost: [
            "Flash Sale",
            "Limited Time",
            "Offer",
            "Discount",
            "Amazon",
            "Flipkart",
            "Myntra"
        ]
    },
    weekend_experience: {
        active_window: {
            start_day: 5,      // Friday
            start_hour: 14,    // 2 PM
            end_day: 0,        // Sunday
            end_hour: 23       // 11 PM
        },
        boost_categories: [
            "entertainment",
            "social",
            "local", // Events often local
            "lifestyle",
            "food",
            "travel"
        ]
    },
    morning_brief: {
         active_window: {
            start_hour: 5,
            end_hour: 10
         },
         boost_categories: [
             "world",
             "india",
             "business",
             "market"
         ]
    }
};
