import { router } from "expo-router";
import { api } from "./apiInterceptors";
import { Alert } from "react-native";
import { resetAndNavigate } from "@/utils/Helpers";
import { useUserStore } from "@/store/userStore";

interface coords {
  address: string;
  latitude: number;
  longitude: number;
}

// ============================================
// MULTI-PASSENGER FEATURE - Service Functions
// ============================================

export const joinRide = async (rideId: string, payload: any = {}) => {
  try {
    console.log(`🚗 Joining ride: ${rideId} with payload:`, JSON.stringify(payload));
    const res = await api.post(`/ride/join/${rideId}`, payload, {
      timeout: 10000, // 10 second timeout
    });
    console.log("✅ Successfully joined ride:", res.data);
    return res.data.ride;
  } catch (error: any) {
    console.error("❌ Error joining ride:", error);

    // Better error handling
    let errorMessage = "Failed to join ride";

    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      console.error("Server error:", error.response.status, errorMessage);
    } else if (error.request) {
      // Request made but no response
      errorMessage = "No response from server. Check your connection.";
      console.error("Network error:", error.request);
    } else {
      // Something else happened
      errorMessage = error.message || errorMessage;
      console.error("Request error:", error.message);
    }

    Alert.alert("Error", errorMessage);
    return null;
  }
};

export const getAvailableRidesForJoining = async () => {
  try {
    console.log('🔍 Fetching available rides for joining...');
    const res = await api.get(`/ride/available-for-joining`, {
      timeout: 10000, // 10 second timeout
    });
    console.log(`✅ Found ${res.data.count} available rides to join`);
    return res.data.rides || [];
  } catch (error: any) {
    console.error("❌ Error fetching available rides:", error);

    if (error.response) {
      console.error("Server error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("Network error - no response received");
    } else {
      console.error("Request error:", error.message);
    }

    return [];
  }
};

// ============================================

export const createRide = async (payload: {
  vehicle: "Single Motorcycle" | "Tricycle" | "Cab";
  pickup: coords;
  drop: coords;
}) => {
  try {
    console.log("Sending ride creation request with payload:", JSON.stringify(payload, null, 2));

    const res = await api.post(`/ride/create`, payload);

    console.log("Ride created successfully:", res.data);

    router?.navigate({
      pathname: "/customer/liveride",
      params: {
        id: res?.data?.ride?._id,
      },
    });
  } catch (error: any) {
    console.error("Error:Create Ride ", error);

    // Enhanced error logging
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response headers:", error.response.headers);

      // Show specific error message from server if available
      const errorMessage = error.response.data?.message || error.response.data?.error || "Failed to create ride";
      Alert.alert("Error", errorMessage);
    } else if (error.request) {
      console.error("Request error:", error.request);
      Alert.alert("Network Error", "Unable to connect to server. Please check your internet connection.");
    } else {
      console.error("Error message:", error.message);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  }
};

export const getMyRides = async (isCustomer: boolean = true) => {
  try {
    const res = await api.get(`/ride/rides`);
    const currentUserId = useUserStore.getState().user?.id;

    console.log(`🔍 getMyRides: Current user ID: ${currentUserId}`);
    console.log(`🔍 getMyRides: Total rides returned: ${res.data.rides?.length || 0}`);

    // Only navigate to ACTIVE rides (exclude COMPLETED, CANCELLED, TIMEOUT)
    // AND exclude rides where current user is a DROPPED passenger
    const activeRides = res.data.rides?.filter(
      (ride: any) => {
        console.log(`🔍 Checking ride ${ride._id} - Status: ${ride.status}`);

        const isActiveRide =
          ride?.status === "SEARCHING_FOR_RIDER" ||
          ride?.status === "START" ||
          ride?.status === "ARRIVED";

        if (!isActiveRide) {
          console.log(`❌ Ride ${ride._id} is not active (status: ${ride.status})`);
          return false;
        }

        // Check if current user is a DROPPED passenger in this ride
        if (currentUserId && ride?.passengers?.length > 0) {
          console.log(`👥 Ride ${ride._id} has ${ride.passengers.length} passengers`);

          const currentPassenger = ride.passengers.find(
            (p: any) => {
              const pUserId = p.userId?._id || p.userId;
              console.log(`  - Checking passenger: ${pUserId} (status: ${p.status})`);
              return pUserId === currentUserId;
            }
          );

          if (currentPassenger) {
            console.log(`✅ Found current user as passenger - Status: ${currentPassenger.status}`);

            // If user is a DROPPED passenger, exclude this ride
            if (currentPassenger.status === 'DROPPED') {
              console.log(`🚫 EXCLUDING ride ${ride._id} - current user is DROPPED passenger`);
              return false;
            }
          } else {
            console.log(`⚠️ Current user not found in passengers list for ride ${ride._id}`);
          }
        }

        console.log(`✅ Including ride ${ride._id} in active rides`);
        return true;
      }
    );

    if (activeRides?.length > 0) {
      console.log(`🚗 Found ${activeRides.length} active ride(s), navigating to first one: ${activeRides[0]?._id}`);
      router?.navigate({
        pathname: isCustomer ? "/customer/liveride" : "/rider/liveride",
        params: {
          id: activeRides[0]?._id,
        },
      });
    } else {
      console.log('✅ No active rides found (or user is dropped from all active rides)');
    }
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log("Error:GET MY Ride ", error);
  }
};

export const getRideHistoryCompleted = async () => {
  try {
    const res = await api.get(`/ride/rides?status=COMPLETED`);
    return res.data.rides || [];
  } catch (error: any) {
    console.log("Error: Get Completed Ride History ", error);
    Alert.alert("Error", "Failed to fetch ride history");
    return [];
  }
};

export const acceptRideOffer = async (rideId: string) => {
  try {
    const res = await api.patch(`/ride/accept/${rideId}`);
    resetAndNavigate({
      pathname: "/rider/liveride",
      params: { id: rideId },
    });
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log(error);
  }
};

export const updateRideStatus = async (rideId: string, status: string, location?: { latitude: number; longitude: number; address?: string }, distanceTraveled?: number) => {
  try {
    const res = await api.patch(`/ride/update/${rideId}`, { status, location, distanceTraveled });
    return true;
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log(error);
    return false;
  }
};

export const getRideHistory = async (status?: string) => {
  try {
    // If no status specified, only return completed rides for history
    const queryParams = status ? `?status=${status}` : '?status=COMPLETED';
    const res = await api.get(`/ride/rides${queryParams}`);
    return res.data.rides || [];
  } catch (error: any) {
    console.log("Error: Get Ride History ", error);
    Alert.alert("Error", "Failed to fetch ride history");
    return [];
  }
};

// Rating related functions
export const submitRating = async (rideId: string, rating: number, comment?: string, displayName?: string) => {
  try {
    const res = await api.post('/rating/create', {
      rideId,
      rating,
      comment,
      displayName
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    console.log("Error: Submit Rating ", error);
    Alert.alert("Error", "Failed to submit rating");
    return { success: false, error };
  }
};

// Create rating with anonymous display name support
export const createRating = async (data: { rideId: string; rating: number; comment?: string; displayName?: string }) => {
  try {
    const res = await api.post('/rating/create', data);
    return res.data;
  } catch (error: any) {
    console.log("Error: Create Rating ", error);
    throw error;
  }
};

export const checkRideRating = async (rideId: string) => {
  try {
    const res = await api.get(`/rating/check/${rideId}`);
    return { rated: res.data.rated, rating: res.data.rating };
  } catch (error: any) {
    console.log("Error: Check Ride Rating ", error);
    return { rated: false, rating: null };
  }
};

export const getRiderRatings = async (riderId: string) => {
  try {
    const res = await api.get(`/rating/rider/${riderId}`);
    return res.data;
  } catch (error: any) {
    console.log("Error: Get Rider Ratings ", error);
    Alert.alert("Error", "Failed to fetch rider ratings");
    return { count: 0, averageRating: 0, ratings: [] };
  }
};

export const getMyRatings = async () => {
  try {
    const res = await api.get('/rating/my-ratings');
    return res.data;
  } catch (error: any) {
    console.log("Error: Get My Ratings ", error);
    Alert.alert("Error", "Failed to fetch your ratings");
    return { count: 0, averageRating: 0, ratings: [] };
  }
};

export const cancelRideOffer = async (rideId: string) => {
  try {
    const res = await api.delete(`/ride/cancel/${rideId}`);
    return true;
  } catch (error: any) {
    Alert.alert("Error", "Failed to cancel ride offer");
    console.log("Error: Cancel Ride Offer ", error);
    return false;
  }
};
