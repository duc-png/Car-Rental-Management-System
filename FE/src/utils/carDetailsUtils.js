import { calculateOwnerPerformanceStats } from './ownerPerformanceStats';

export const DAY_MS = 24 * 60 * 60 * 1000;

export const FALLBACK_CAR = {
    id: 0,
    brandName: 'Xe mẫu',
    modelName: 'Đang cập nhật',
    carTypeName: 'SUV',
    licensePlate: 'N/A',
    color: 'N/A',
    seatCount: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    pricePerDay: 0,
    status: 'AVAILABLE',
    currentKm: 0,
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Bến Nghé',
    addressDetail: 'Đang cập nhật',
    ownerName: 'Chưa cập nhật',
    ownerPhone: 'Chưa cập nhật',
    ownerEmail: 'Chưa cập nhật',
    mainImageUrl: '/placeholder.svg',
    images: []
};

export const toDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const formatDateShort = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
};

export const formatOwnerName = (name) => {
    if (!name || typeof name !== 'string') return 'Chưa cập nhật';
    return name
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const isSameDate = (a, b) => {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export const getMonthGrid = (baseMonthDate) => {
    const year = baseMonthDate.getFullYear();
    const month = baseMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingEmptyCount = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const cells = [];
    for (let index = 0; index < leadingEmptyCount; index += 1) {
        cells.push(null);
    }
    for (let day = 1; day <= totalDays; day += 1) {
        cells.push(new Date(year, month, day));
    }

    return {
        title: `Tháng ${month + 1}`,
        cells
    };
};

export const formatVndNumber = (value) => {
    const numeric = Number(value || 0);
    return `${Math.round(numeric).toLocaleString('vi-VN')} VNĐ`;
};

export const formatVndK = (value) => {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) return '0K';
    const inThousands = Math.round(numeric / 1_000);
    return `${inThousands.toLocaleString('vi-VN')}K`;
};

export const TRANSMISSION_LABELS = {
    AUTOMATIC: 'Tự động',
    MANUAL: 'Số sàn',
};

export const FUEL_LABELS = {
    GASOLINE: 'Xăng',
    DIESEL: 'Dầu',
    ELECTRIC: 'Điện',
};

export const getTransmissionLabel = (transmission) => TRANSMISSION_LABELS[transmission] || transmission || 'N/A';

export const getFuelLabel = (fuelType) => FUEL_LABELS[fuelType] || fuelType || 'N/A';

export const getFuelConsumptionLabel = (car) => {
    const fuelType = String(car?.fuelType || '').trim().toUpperCase();
    const isElectric = fuelType === 'ELECTRIC';
    const rawFuelConsumption = car?.fuelConsumption
        ?? car?.fuelEfficiency
        ?? car?.averageFuelConsumption
        ?? car?.avgFuelConsumption
        ?? car?.consumptionPer100Km
        ?? car?.consumption;

    if (rawFuelConsumption === null || rawFuelConsumption === undefined) return 'N/A';
    const text = String(rawFuelConsumption).trim();
    if (!text) return 'N/A';
    if (/[a-zA-Z]/.test(text) || text.includes('/')) return text;
    return isElectric ? `${text} km/lần sạc đầy` : `${text} L/100km`;
};

export const buildAddressInfo = (car) => {
    const province = car?.province || car?.city || '';
    const district = car?.district || '';
    const ward = car?.ward || '';

    const addressText = [car?.addressDetail, ward, district, province]
        .filter(Boolean)
        .join(', ');

    const locationDisplayText = [car?.addressDetail, ward, district].filter(Boolean).join(', ')
        || [ward, district, province].filter(Boolean).join(', ')
        || addressText;

    return {
        addressText,
        locationDisplayText,
        hasAddress: Boolean(addressText),
    };
};

export const calculatePricing = ({ pricePerDay, selectedDays, enableExtraInsurance, voucherDiscountPercent = 0 }) => {
    const normalizedPricePerDay = Number(pricePerDay || 0);
    const bookingFeePerDay = Math.round(normalizedPricePerDay * 0.08);
    const insuranceFeePerDay = Math.round(normalizedPricePerDay * 0.03);
    const extraInsurancePerDay = Math.round(normalizedPricePerDay * 0.02);

    const rentalCost = normalizedPricePerDay * selectedDays;
    const bookingFee = bookingFeePerDay * selectedDays;
    const insuranceFee = insuranceFeePerDay * selectedDays;
    const extraInsuranceFee = enableExtraInsurance ? extraInsurancePerDay * selectedDays : 0;

    const subtotalPrice = rentalCost + bookingFee + insuranceFee + extraInsuranceFee;
    const promoDiscount = Math.round(normalizedPricePerDay * 0.05) * selectedDays;

    const voucherPercent = Number(voucherDiscountPercent || 0);
    const voucherDiscount = voucherPercent > 0 ? Math.round(subtotalPrice * voucherPercent / 100) : 0;

    const totalPrice = Math.max(0, subtotalPrice - promoDiscount - voucherDiscount);

    const oldPrice = Math.round(normalizedPricePerDay * 1.06);
    const discountPercent = Math.max(1, Math.round(((oldPrice - normalizedPricePerDay) / oldPrice) * 100));

    return {
        pricePerDay: normalizedPricePerDay,
        bookingFeePerDay,
        insuranceFeePerDay,
        extraInsurancePerDay,
        subtotalPrice,
        promoDiscount,
        voucherDiscount,
        totalPrice,
        discountPercent,
    };
};

export const getOwnerPerformanceStats = (owner) => calculateOwnerPerformanceStats(owner);

const normalizeAddressText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const scoreGeocodeCandidate = (candidate, query) => {
    const name = String(candidate?.display_name || '').toLowerCase();
    const countryCode = String(candidate?.address?.country_code || '').toLowerCase();
    const normalizedQuery = String(query || '').toLowerCase();
    const tokens = normalizedQuery.split(',').map((part) => part.trim()).filter(Boolean);

    let score = Number(candidate?.importance || 0);
    if (countryCode === 'vn') score += 0.2;
    for (const token of tokens) {
        if (token && name.includes(token)) {
            score += 0.08;
        }
    }
    return score;
};

export const geocodeAddress = async (query, signal) => {
    const q = normalizeAddressText(query);
    if (!q) return null;

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=5&countrycodes=vn`;

    try {
        const response = await fetch(url, {
            signal,
            headers: { 'Accept-Language': 'vi,en;q=0.9' }
        });
        if (!response.ok) return null;

        const data = await response.json();
        const candidates = Array.isArray(data) ? data : [];
        const best = candidates
            .filter((item) => item?.lat && item?.lon)
            .sort((left, right) => scoreGeocodeCandidate(right, q) - scoreGeocodeCandidate(left, q))[0];

        if (best?.lat && best?.lon) {
            return {
                lat: Number(best.lat),
                lon: Number(best.lon),
                label: best.display_name || q
            };
        }
    } catch (err) {
        if (err.name === 'AbortError') throw err;
    }
    return null;
};

const normalizeGeoText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildTokenSet = (value) => new Set(
    normalizeGeoText(value)
        .split(' ')
        .filter((token) => token.length >= 2)
);

const similarityScore = (referenceText, candidateText) => {
    const refTokens = buildTokenSet(referenceText);
    const candidateTokens = buildTokenSet(candidateText);

    if (!refTokens.size || !candidateTokens.size) return 0;

    let matches = 0;
    refTokens.forEach((token) => {
        if (candidateTokens.has(token)) matches += 1;
    });

    return matches / refTokens.size;
};

export const resolveBestGeocodeFromVariants = async (variants, referenceQuery, signal) => {
    const safeVariants = Array.isArray(variants) ? variants.filter(Boolean) : [];
    if (safeVariants.length === 0) return null;

    let best = null;
    let bestScore = -1;

    for (let index = 0; index < safeVariants.length; index += 1) {
        const variant = safeVariants[index];
        const result = await geocodeAddress(variant, signal);
        if (!result) continue;

        const baseScore = similarityScore(referenceQuery || variant, result.label || variant);
        const indexPenalty = index * 0.01;
        const score = baseScore - indexPenalty;

        if (!best || score > bestScore) {
            best = result;
            bestScore = score;
        }
    }

    return best;
};

export const generateQueryVariants = (detail, district, city) => {
    const d = (detail || '').trim();
    const dist = (district || '').trim();
    const c = (city || '').trim();

    const variants = new Set();

    variants.add([d, dist, c, 'Việt Nam'].filter(Boolean).join(', '));

    const vnDist = dist
        .replace(/District (\d+)/i, 'Quận $1')
        .replace(/Cau Giay/i, 'Cầu Giấy')
        .replace(/Ha Noi/i, 'Hà Nội')
        .replace(/Ho Chi Minh/i, 'Hồ Chí Minh');
    variants.add([d, vnDist, c, 'Việt Nam'].filter(Boolean).join(', '));

    if (d && /^\d/.test(d)) {
        const base = [d, dist, c].filter(Boolean).join(', ');
        variants.add(base + ' Tower');
        variants.add(base + ' Building');
        variants.add(base + ' Office');
        variants.add(d + ' Tower, ' + [dist, c].filter(Boolean).join(', '));
    }

    const lowerDist = dist.toLowerCase();
    const lowerCity = c.toLowerCase();

    if (lowerCity.includes('hà nội') || lowerCity.includes('ha noi')) {
        if (lowerDist.includes('cầu giấy') || lowerDist.includes('cau giay')) {
            variants.add('Cầu Giấy, Hà Nội');
            variants.add('Hoàng Quốc Việt, Cầu Giấy, Hà Nội');
        }
        variants.add('Hà Nội, Việt Nam');
    } else if (lowerCity.includes('hồ chí minh') || lowerCity.includes('ho chi minh')) {
        if (lowerDist.includes('quận 1') || lowerDist.includes('district 1')) {
            variants.add('Bến Thành, Quận 1, Hồ Chí Minh');
        }
        if (lowerDist.includes('quận 7') || lowerDist.includes('district 7')) {
            variants.add('Phú Mỹ Hưng, Quận 7, Hồ Chí Minh');
        }
        variants.add('Hồ Chí Minh, Việt Nam');
    }

    variants.add([dist, c, 'Việt Nam'].filter(Boolean).join(', '));

    return Array.from(variants);
};

export const haversineDistanceKm = (a, b) => {
    if (!a?.lat || !a?.lon || !b?.lat || !b?.lon) return 0;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
    return R * c;
};

export const reverseGeocode = async (lat, lon, signal) => {
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;

    try {
        const response = await fetch(url, {
            signal,
            headers: { 'Accept-Language': 'vi,en;q=0.9' }
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data?.display_name || null;
    } catch (err) {
        if (err?.name === 'AbortError') throw err;
        return null;
    }
};

export const routeDistanceKm = async (origin, destination, signal) => {
    if (!origin?.lat || !origin?.lon || !destination?.lat || !destination?.lon) return null;

    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false`;

    try {
        const response = await fetch(url, { signal });
        if (!response.ok) return null;

        const data = await response.json();
        const distanceMeters = data?.routes?.[0]?.distance;
        if (!Number.isFinite(Number(distanceMeters))) return null;
        return Number(distanceMeters) / 1000;
    } catch (err) {
        if (err?.name === 'AbortError') throw err;
        return null;
    }
};
