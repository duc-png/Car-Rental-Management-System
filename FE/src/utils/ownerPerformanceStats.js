const toSafeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toSafeInt = (value, fallback = 0) => Math.max(0, Math.round(toSafeNumber(value, fallback)));

export const calculateOwnerPerformanceStats = (owner) => {
    const avgRating = Math.min(5, Math.max(0, toSafeNumber(owner?.avgRating, 0)));
    const totalTrips = toSafeInt(owner?.totalTrips, 0);
    const totalReviews = toSafeInt(owner?.totalReviews, 0);
    const responseRateValue = toSafeInt(owner?.responseRate, 0);
    const approvalRateValue = toSafeInt(owner?.approvalRate, 0);
    const responseTimeMinutes = toSafeInt(owner?.responseTimeMinutes, 0);

    return {
        ratingValue: Number(avgRating.toFixed(1)),
        totalTrips,
        totalReviews,
        responseRateValue,
        responseRate: `${responseRateValue}%`,
        responseTimeMinutes,
        responseTime: `${responseTimeMinutes} phút`,
        approvalRateValue,
        approvalRate: `${approvalRateValue}%`,
    };
};
