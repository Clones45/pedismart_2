import { useState, useEffect } from 'react';
import { reverseGeocode, isPlusCode as checkPlusCode } from '@/utils/mapUtils';

interface UseReverseGeocodingResult {
    address: string;
    isLoading: boolean;
    error: string | null;
}

export const useReverseGeocoding = (
    latitude?: number,
    longitude?: number,
    initialAddress?: string
): UseReverseGeocodingResult => {
    const [address, setAddress] = useState<string>(initialAddress || '');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchAddress = async () => {
            // If we don't have coordinates, we can't reverse geocode
            if (!latitude || !longitude) return;

            // Heuristic: If initialAddress is provided and looks like a real address (contains spaces, letters, etc.)
            // and isn't just a short code, we might skip.
            // However, Plus Codes can look like "P8MH+P3C", so checking for '+' might be tricky.
            // Use a simple check: if it's longer than 15 chars and has spaces, it's LIKELY a real address.
            // But to be safe and solve the user's issue, we should probably try to geocode if it looks short
            // or if force update is needed.
            // For now, let's treat "P8MH+P3C" as something that needs update.
            // If initialAddress is just "Live Location", we definitely want to update.

            const isPlusCode = initialAddress && checkPlusCode(initialAddress);
            const isLiveLocation = initialAddress === 'Live Location';

            // Heuristic for coordinate strings (e.g., "6.7499, 125.3575")
            // Coordinate strings usually follow a pattern of numbers and a comma
            const isCoordinate = initialAddress && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(initialAddress);

            // If we have a good looking address, use it initially
            if (initialAddress && !isPlusCode && !isLiveLocation && !isCoordinate) {
                setAddress(initialAddress);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = await reverseGeocode(latitude, longitude);
                if (isMounted) {
                    // mapUtils returns "Selected location" on failure, so we handle that if needed,
                    // but for now we just use what it returns.
                    if (result) {
                        setAddress(result);
                    } else if (initialAddress) {
                        // Fallback to initial if reverse geocode failed completely
                        setAddress(initialAddress);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to fetch address');
                    if (initialAddress) setAddress(initialAddress);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchAddress();

        return () => {
            isMounted = false;
        };
    }, [latitude, longitude, initialAddress]);

    return { address, isLoading, error };
};
