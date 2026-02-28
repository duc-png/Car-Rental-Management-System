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
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
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
    return Math.round(numeric).toLocaleString('vi-VN');
};

export const formatVndK = (value) => {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) return '0K';
    const inThousands = Math.round(numeric / 1_000);
    return `${inThousands.toLocaleString('vi-VN')}K`;
};

export const geocodeAddress = async (query, signal) => {
    const q = (query || '').trim();
    if (!q) return null;

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=1&countrycodes=vn`;

    try {
        const response = await fetch(url, {
            signal,
            headers: { 'Accept-Language': 'vi,en;q=0.9' }
        });
        if (!response.ok) return null;

        const data = await response.json();
        const first = Array.isArray(data) ? data[0] : null;

        if (first?.lat && first?.lon) {
            return {
                lat: Number(first.lat),
                lon: Number(first.lon),
                label: first.display_name || q
            };
        }
    } catch (err) {
        if (err.name === 'AbortError') throw err;
    }
    return null;
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
