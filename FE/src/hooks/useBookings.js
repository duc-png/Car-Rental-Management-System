'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMyBookings } from '../api/bookings';

export const useBookings = ({ autoLoad = true } = {}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách đặt xe');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    fetchBookings();
  }, [autoLoad, fetchBookings]);

  return { bookings, loading, error, refetchBookings: fetchBookings };
};

