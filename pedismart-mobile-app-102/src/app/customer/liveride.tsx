import { View, Text, Platform, ActivityIndicator, Alert, BackHandler } from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { screenHeight } from "@/utils/Constants";
import { useWS } from "@/service/WSProvider";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import { rideStyles } from "@/styles/rideStyles";
import { StatusBar } from "expo-status-bar";
import LiveTrackingMap from "@/components/customer/LiveTrackingMap";
import CustomText from "@/components/shared/CustomText";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import SearchingRideSheet from "@/components/customer/SearchingRideSheet";
import LiveTrackingSheet from "@/components/customer/LiveTrackingSheet";
import RideCompletedSheet from "@/components/customer/RideCompletedSheet";
import RideCanceledSheet from "@/components/customer/RideCanceledSheet";
import { resetAndNavigate } from "@/utils/Helpers";
import { useUserStore } from "@/store/userStore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const androidHeights = [screenHeight * 0.12, screenHeight * 0.42];
const iosHeights = [screenHeight * 0.2, screenHeight * 0.5];

const LiveRide = () => {
  const { emit, on, off } = useWS();
  const { user } = useUserStore();
  const navigation = useNavigation();
  const [rideData, setRideData] = useState<any>(null);
  const [riderCoords, setriderCoords] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const route = useRoute() as any;
  const params = route?.params || {};
  const id = params.id;
  const bottomSheetRef = useRef(null);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);
  const isDroppedPassenger = useRef(false);
  const snapPoints = useMemo(
    () => (Platform.OS === "ios" ? iosHeights : androidHeights),
    []
  );
  const [mapHeight, setMapHeight] = useState(snapPoints[0]);

  const handleSheetChanges = useCallback((index: number) => {
    let height = screenHeight * 0.8;
    if (index == 1) {
      height = screenHeight * 0.5;
    }
    setMapHeight(height);
  }, []);

  // CRITICAL: Check AsyncStorage on mount to see if this ride has a dropped passenger
  useEffect(() => {
    const checkDroppedStatus = async () => {
      if (id && user?.id) {
        const droppedKey = `dropped_passenger_${user.id}_${id}`;
        const isDropped = await AsyncStorage.getItem(droppedKey);

        if (isDropped === 'true') {
          console.log('🚫 CRITICAL: User is marked as DROPPED in AsyncStorage - redirecting to home immediately');
          isDroppedPassenger.current = true;
          resetAndNavigate("/customer/home");
        }
      }
    };

    checkDroppedStatus();
  }, [id, user?.id]);

  // CRITICAL: Block navigation back to live ride if passenger is DROPPED
  useFocusEffect(
    useCallback(() => {
      if (isDroppedPassenger.current) {
        console.log('🚫 BLOCKED: Dropped passenger tried to access live ride - redirecting to home');
        // Immediately redirect to home
        resetAndNavigate("/customer/home");
        return;
      }
    }, [])
  );

  useEffect(() => {
    // CRITICAL: Don't subscribe if passenger is already dropped
    if (isDroppedPassenger.current) {
      console.log('🚫 Skipping ride subscription - passenger is DROPPED');
      setIsLoading(false);
      return;
    }

    if (id) {
      console.log('Subscribing to ride:', id);
      emit("subscribeRide", id);

      on("rideData", async (data) => {
        console.log('Received ride data:', JSON.stringify(data, null, 2));

        // Check if current user is a passenger and their status is DROPPED
        if (user?.id && data?.passengers) {
          const currentPassenger = data.passengers.find(
            (p: any) => (p.userId?._id || p.userId) === user.id
          );

          if (currentPassenger && currentPassenger.status === 'DROPPED') {
            console.log('🏁 Current user is DROPPED passenger - DISCONNECTING');
            isDroppedPassenger.current = true;

            // CRITICAL: Store dropped status in AsyncStorage
            if (user?.id && id) {
              const droppedKey = `dropped_passenger_${user.id}_${id}`;
              await AsyncStorage.setItem(droppedKey, 'true');
              console.log(`💾 Stored dropped status in AsyncStorage: ${droppedKey}`);
            }

            // CRITICAL: Leave the ride room immediately
            emit("leaveRide", id);
            console.log('🚨 Left ride socket room on initial load');

            // Show complete screen
            setRideData({ ...data, status: 'COMPLETED' });
            setIsLoading(false);
            return;
          }
        }

        // Only redirect if ride is already finished on INITIAL LOAD (not during the ride)
        if (isInitialLoad.current && (data?.status === "CANCELLED" || data?.status === "COMPLETED" || data?.status === "TIMEOUT")) {
          console.log(`⚠️ Ride is already ${data.status} on initial load, navigating to home immediately`);
          emit("leaveRide", id);
          resetAndNavigate("/customer/home");
          return;
        }

        // Mark that initial load is complete
        isInitialLoad.current = false;

        setRideData(data);
        setIsLoading(false);
        setError(null);
        if (data?.status === "SEARCHING_FOR_RIDER") {
          emit("searchrider", id);
        }
      });

      on("rideUpdate", (data) => {
        console.log('Received ride update:', JSON.stringify(data, null, 2));

        // If this passenger is DROPPED, don't update the view
        if (isDroppedPassenger.current) {
          console.log('🚫 Ignoring ride update - passenger is DROPPED');
          return;
        }

        // Check if current user is DROPPED in this update
        if (user?.id && data?.passengers) {
          const currentPassenger = data.passengers.find(
            (p: any) => (p.userId?._id || p.userId) === user.id
          );

          if (currentPassenger && currentPassenger.status === 'DROPPED') {
            console.log('🏁 Passenger is DROPPED in update - maintaining complete screen');
            isDroppedPassenger.current = true;
            return; // Don't update, keep complete screen
          }
        }

        setRideData(data);
        setError(null);
      });

      on("passengerUpdate", (data) => {
        console.log('👥 Passenger update received:', data);

        // If this passenger is DROPPED, don't update the view
        if (isDroppedPassenger.current) {
          console.log('🚫 Ignoring passenger update - passenger is DROPPED');
          return;
        }

        // Check if current user is DROPPED in this update
        if (user?.id && data?.passengers) {
          const currentPassenger = data.passengers.find(
            (p: any) => (p.userId?._id || p.userId) === user.id
          );

          if (currentPassenger && currentPassenger.status === 'DROPPED') {
            console.log('🏁 Passenger is DROPPED in update - maintaining complete screen');
            isDroppedPassenger.current = true;
            return; // Don't update, keep complete screen
          }
        }

        setRideData(data);
      });

      on("yourStatusUpdated", async (data) => {
        console.log('👤 Your status updated:', data.status);

        // If passenger is marked as DROPPED, immediately show complete screen
        if (data.status === 'DROPPED') {
          console.log('🏁 Passenger marked as DROPPED - DISCONNECTING FROM RIDE');

          // CRITICAL: If we've already processed this drop (redundant update), bail early
          if (isDroppedPassenger.current) {
            console.log('♻️ Ignoring redundant DROPPED status update');
            return;
          }

          // Mark as dropped passenger
          isDroppedPassenger.current = true;

          // CRITICAL: Store dropped status in AsyncStorage to persist across app restarts
          if (user?.id && id) {
            const droppedKey = `dropped_passenger_${user.id}_${id}`;
            await AsyncStorage.setItem(droppedKey, 'true');
            console.log(`💾 Stored dropped status in AsyncStorage: ${droppedKey}`);
          }

          // CRITICAL: Leave the ride socket room to stop receiving updates
          emit("leaveRide", id);
          console.log('🚨 Left ride socket room - no more updates will be received');

          // Immediately set ride status to COMPLETED for this passenger's view
          setRideData({ ...data.ride, status: 'COMPLETED' });

          // Show alert after changing the view
          setTimeout(() => {
            Alert.alert(
              "You've Been Dropped Off",
              "The rider has marked you as dropped off. Thank you for riding with us!",
              [{ text: "OK" }]
            );
          }, 500);
        } else {
          // For other status updates, just update the ride data
          setRideData(data.ride);
        }
      });

      on("removedFromRide", (data) => {
        console.log('👋 Removed from ride:', data);
        Alert.alert(
          "Removed from Ride",
          data.message || "You have been removed from this ride",
          [
            {
              text: "OK",
              onPress: () => {
                emit("leaveRide", id);
                resetAndNavigate("/customer/home");
              }
            }
          ]
        );
      });

      on("joinRequestApproved", (data) => {
        console.log('✅ Join request approved:', data);
        Alert.alert(
          "Request Approved!",
          data.message || "The rider has approved your join request. You are now part of this ride!",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to live ride tracking
                resetAndNavigate(`/customer/liveride?id=${data.rideId}`);
              }
            }
          ]
        );
      });

      on("joinRequestDeclined", (data) => {
        console.log('❌ Join request declined:', data);
        Alert.alert(
          "Request Declined",
          data.message || "The rider has declined your join request.",
          [
            {
              text: "OK",
              onPress: () => {
                resetAndNavigate("/customer/home");
              }
            }
          ]
        );
      });

      on("rideAccepted", (data) => {
        console.log('Ride accepted event received:', JSON.stringify(data, null, 2));
        if (data) {
          setRideData(data);
        }
      });

      on("rideCompleted", async (data) => {
        console.log('Ride completed event received:', JSON.stringify(data, null, 2));
        if (data) {
          setRideData(data);
          // Leave the ride room immediately to stop receiving updates
          emit("leaveRide", id);

          // CRITICAL: Clear dropped passenger status from AsyncStorage when ride is completed
          if (user?.id && id) {
            const droppedKey = `dropped_passenger_${user.id}_${id}`;
            await AsyncStorage.removeItem(droppedKey);
            console.log(`🗑️ Cleared dropped status from AsyncStorage: ${droppedKey}`);
          }
        }
      });

      on("rideCanceled", (data) => {
        console.log('Ride canceled:', data);
        // CRITICAL: Only process if this is OUR ride
        const cancelledRideId = data?.ride?._id || data?.rideId;
        if (cancelledRideId === id) {
          if (data?.ride) {
            setRideData(data.ride);
            // Leave the ride room immediately to stop receiving updates
            emit("leaveRide", id);
          } else {
            setError('Ride was canceled');
            setIsLoading(false);
            emit("leaveRide", id);
            cleanupAndNavigateHome();
          }
        } else {
          console.log(`Ignoring cancellation for different ride: ${cancelledRideId} (our ride: ${id})`);
        }
      });

      on("riderCancelledRide", (data) => {
        console.log("Rider cancelled ride:", data);
        // CRITICAL: Only show alert if this is OUR ride
        if (data?.rideId === id) {
          // Leave the ride room immediately
          emit("leaveRide", id);
          Alert.alert(
            "Rider Cancelled Ride",
            `${data.riderName} has cancelled the ride. You will be redirected to the home screen.`,
            [
              {
                text: "OK",
                onPress: () => {
                  resetAndNavigate("/customer/home");
                }
              }
            ]
          );
        } else {
          console.log(`Ignoring rider cancellation for different ride: ${data?.rideId} (our ride: ${id})`);
        }
      });

      on("error", (error) => {
        console.error('Ride error:', error);
        setError('Failed to load ride data');
        setIsLoading(false);
        resetAndNavigate("/customer/home");
        Alert.alert("Oh Dang! No Riders Found");
      });
    }

    return () => {
      off("rideData");
      off("rideUpdate");
      off("rideAccepted");
      off("rideCompleted");
      off("rideCanceled");
      off("riderCancelledRide");
      off("error");
      off("passengerUpdate");
      off("yourStatusUpdated");
      off("removedFromRide");
      off("joinRequestApproved");
      off("joinRequestDeclined");
    };
  }, [id, emit, on, off]);

  useEffect(() => {
    if (rideData?.rider?._id) {
      console.log('Subscribing to rider location:', rideData.rider._id);
      emit("subscribeToriderLocation", rideData.rider._id);
      on("riderLocationUpdate", (data) => {
        console.log('Received rider location update:', JSON.stringify(data, null, 2));
        if (data?.coords) {
          console.log('Setting rider coordinates:', data.coords);
          setriderCoords(data.coords);
        } else {
          console.log('No coords in rider location update');
        }
      });
    }

    return () => {
      off("riderLocationUpdate");
    };
  }, [rideData?.rider?._id]);

  // Force refresh ride data every 3 seconds to ensure we get updates
  useEffect(() => {
    // CRITICAL: Don't refresh if passenger is dropped
    if (isDroppedPassenger.current) {
      return;
    }

    if (id && rideData?.status === "SEARCHING_FOR_RIDER") {
      const interval = setInterval(() => {
        console.log('Force refreshing ride data...');
        emit("subscribeRide", id);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [id, rideData?.status, emit]);

  // Cleanup function to clear all socket listeners and navigate home
  const cleanupAndNavigateHome = useCallback(() => {
    console.log('🧹 Starting cleanup process...');

    // Clear any pending navigation timers
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }

    // Leave the ride room
    if (id) {
      console.log('📤 Leaving ride room:', id);
      emit("leaveRide", id);
    }

    // Unsubscribe from rider location updates
    if (rideData?.rider?._id) {
      console.log('📍 Unsubscribing from rider location');
      emit("unsubscribeFromriderLocation", rideData.rider._id);
    }

    // Clear all socket listeners
    console.log('🔌 Clearing all socket listeners');
    off("rideData");
    off("rideUpdate");
    off("rideAccepted");
    off("rideCompleted");
    off("rideCanceled");
    off("riderCancelledRide");
    off("riderLocationUpdate");
    off("error");

    // Navigate to home
    console.log('🏠 Navigating to home screen');
    resetAndNavigate("/customer/home");
  }, [id, rideData?.rider?._id, emit, off]);

  // CRITICAL: Dropped passengers will NOT auto-redirect
  // They must use the native back button to return home
  // This prevents the redirect loop caused by getMyRides()

  // Auto-navigate to home when ride status becomes COMPLETED or CANCELLED
  useEffect(() => {
    if (rideData?.status === "COMPLETED") {
      console.log('✅ Ride completed - leaving ride room');
      // Leave the ride room to stop receiving updates
      emit("leaveRide", id);
    } else if (rideData?.status === "CANCELLED") {
      console.log('❌ Ride canceled - setting up auto-navigation timer');
      // Leave the ride room to stop receiving updates
      emit("leaveRide", id);
      navigationTimerRef.current = setTimeout(() => {
        console.log('Auto-navigating to home after ride cancellation');
        cleanupAndNavigateHome();
      }, 5000); // 5 seconds delay

      return () => {
        if (navigationTimerRef.current) {
          clearTimeout(navigationTimerRef.current);
          navigationTimerRef.current = null;
        }
      };
    }
  }, [rideData?.status, emit, id, cleanupAndNavigateHome]);

  return (
    <View style={rideStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />

      {rideData ? (
        <LiveTrackingMap
          height={mapHeight}
          status={rideData?.status || 'UNKNOWN'}
          drop={{
            latitude: rideData?.drop?.latitude ? parseFloat(rideData.drop.latitude) : null,
            longitude: rideData?.drop?.longitude ? parseFloat(rideData.drop.longitude) : null,
          }}
          pickup={{
            latitude: rideData?.pickup?.latitude ? parseFloat(rideData.pickup.latitude) : null,
            longitude: rideData?.pickup?.longitude ? parseFloat(rideData.pickup.longitude) : null,
          }}
          rider={
            riderCoords && riderCoords.latitude && riderCoords.longitude
              ? {
                latitude: riderCoords.latitude,
                longitude: riderCoords.longitude,
                heading: riderCoords.heading || 0,
              }
              : null
          }
          vehicleType={rideData?.vehicle}
        />
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <ActivityIndicator size="large" color="orange" />
          <CustomText fontSize={14} style={{ marginTop: 10, color: '#666' }}>Loading ride data...</CustomText>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <CustomText fontSize={14} style={{ color: '#666' }}>No ride data available</CustomText>
        </View>
      )}

      {rideData ? (
        <BottomSheet
          ref={bottomSheetRef}
          index={1}
          handleIndicatorStyle={{
            backgroundColor: "#ccc",
          }}
          enableOverDrag={false}
          enableDynamicSizing={false}
          style={{ zIndex: 4 }}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
        >
          <BottomSheetScrollView contentContainerStyle={rideStyles?.container}>
            {rideData?.status === "SEARCHING_FOR_RIDER" ? (
              <SearchingRideSheet item={rideData} />
            ) : rideData?.status === "COMPLETED" ? (
              <RideCompletedSheet
                item={rideData}
                onNavigateHome={cleanupAndNavigateHome}
                isDroppedPassenger={isDroppedPassenger.current}
              />
            ) : rideData?.status === "CANCELLED" ? (
              <RideCanceledSheet item={rideData} />
            ) : (
              <LiveTrackingSheet item={rideData} />
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      ) : isLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <CustomText variant="h8">Fetching Information...</CustomText>
          <ActivityIndicator color="orange" size="large" />
        </View>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <CustomText variant="h8">No ride data available</CustomText>
          {error && <CustomText fontSize={12} style={{ color: 'red', marginTop: 10 }}>{error}</CustomText>}
        </View>
      )}
    </View>
  );
};

export default memo(LiveRide);
