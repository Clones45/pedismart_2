import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import React, { FC, memo } from "react";
import { useRiderStore } from "@/store/riderStore";
import { acceptRideOffer, cancelRideOffer } from "@/service/rideService";
import Animated, { FadeInLeft, FadeOutRight } from "react-native-reanimated";
import { orderStyles } from "@/styles/riderStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { calculateDistance, vehicleIcons } from "@/utils/mapUtils";
import { Ionicons } from "@expo/vector-icons";
import CounterButton from "./CounterButton";
import { MAX_DISTANCE_KM } from "@/service/config";

type VehicleType = "Tricycle"; // Commented out: "Single Motorcycle" | "Cab"

interface RideItem {
  _id: string;
  vehicle?: VehicleType;
  pickup: { address: string; latitude: number; longitude: number };
  drop?: { address: string; latitude: number; longitude: number };
  fare?: number;
  distance: number;
}

const RiderRidesItem: FC<{ item: RideItem; removeIt: () => void }> = ({
  item,
  removeIt,
}) => {
  const { location, user } = useRiderStore();
  
  // Check if ride matches rider's vehicle type
  const riderVehicleType = user?.vehicleType;
  const isVehicleMatch = !riderVehicleType || item.vehicle === riderVehicleType;
  
  // ============================================
  // Check distance from rider to pickup location
  // ============================================
  const distanceToPickup = location && item.pickup
    ? calculateDistance(
        location.latitude,
        location.longitude,
        item.pickup.latitude,
        item.pickup.longitude
      )
    : null;
  
  const isTooFar = MAX_DISTANCE_KM && distanceToPickup && distanceToPickup > MAX_DISTANCE_KM;
  // ============================================
  
  const acceptRide = async () => {
    // Prevent accepting if vehicle type doesn't match
    if (!isVehicleMatch) {
      Alert.alert(
        "Vehicle Type Mismatch",
        `This ride requires a ${item.vehicle}, but your vehicle type is ${riderVehicleType}. Please update your profile or choose a matching ride.`,
        [{ text: "OK" }]
      );
      return;
    }
    
    // ============================================
    // Prevent accepting if ride is too far (when MAX_DISTANCE is enabled)
    // ============================================
    if (isTooFar) {
      Alert.alert(
        "Ride Too Far",
        `This ride is ${distanceToPickup?.toFixed(1)}km away. Maximum distance is ${MAX_DISTANCE_KM}km. Please choose a closer ride.`,
        [{ text: "OK" }]
      );
      return;
    }
    // ============================================
    
    acceptRideOffer(item?._id);
  };

  const cancelRide = async () => {
    const success = await cancelRideOffer(item?._id);
    if (success) {
      removeIt();
    }
  };

  return (
    <Animated.View
      entering={FadeInLeft.duration(500)}
      exiting={FadeOutRight.duration(500)}
      style={[
        orderStyles.container,
        // Add visual styling for mismatched rides
        !isVehicleMatch && {
          opacity: 0.5,
          backgroundColor: '#f5f5f5',
          borderColor: '#ff6b6b',
          borderWidth: 2,
        },
        // Add visual styling for rides that are too far
        !!isTooFar && {
          opacity: 0.6,
          backgroundColor: '#fff8e1',
          borderColor: '#ff9800',
          borderWidth: 2,
        }
      ]}
    >
      {/* Vehicle Type Mismatch Warning Banner */}
      {!isVehicleMatch && (
        <View style={{
          backgroundColor: '#ff6b6b',
          padding: 8,
          marginBottom: 10,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Ionicons name="warning" size={20} color="white" />
          <CustomText fontSize={10} style={{ color: 'white', flex: 1 }}>
            ⚠️ Vehicle Mismatch: Requires {item.vehicle}, you have {riderVehicleType}
          </CustomText>
        </View>
      )}
      
      {/* Distance Warning Banner (when MAX_DISTANCE is enabled) */}
      {isTooFar && (
        <View style={{
          backgroundColor: '#ff9800',
          padding: 8,
          marginBottom: 10,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Ionicons name="location" size={20} color="white" />
          <CustomText fontSize={10} style={{ color: 'white', flex: 1 }}>
            📏 Too Far: {distanceToPickup?.toFixed(1)}km away (max: {MAX_DISTANCE_KM}km)
          </CustomText>
        </View>
      )}
      <View style={commonStyles.flexRowBetween}>
        <View style={commonStyles.flexRow}>
          {item.vehicle && (
            <Image
              source={vehicleIcons![item.vehicle]?.icon}
              style={[
                orderStyles.rideIcon,
                !isVehicleMatch && { opacity: 0.5 }
              ]}
            />
          )}
          <CustomText style={{ textTransform: "capitalize" }} fontSize={11}>
            {item?.vehicle}
            {!isVehicleMatch && " ❌"}
          </CustomText>
        </View>
      </View>

      <View style={orderStyles?.locationsContainer}>
        <View style={orderStyles?.flexRowBase}>
          <View>
            <View style={orderStyles?.pickupHollowCircle} />
            <View style={orderStyles?.continuousLine} />
          </View>
          <View style={orderStyles?.infoText}>
            <CustomText fontSize={11} numberOfLines={1} fontFamily="SemiBold">
              {item?.pickup?.address?.slice(0, 10)}
            </CustomText>
            <CustomText
              numberOfLines={2}
              fontSize={9.5}
              fontFamily="Medium"
              style={orderStyles.label}
            >
              {item?.pickup?.address}
            </CustomText>
          </View>
        </View>

        <View style={orderStyles.flexRowBase}>
          <View style={orderStyles.dropHollowCircle} />
          <View style={orderStyles.infoText}>
            <CustomText fontSize={11} numberOfLines={1} fontFamily="SemiBold">
              {item?.drop?.address?.slice(0, 10)}
            </CustomText>
            <CustomText
              numberOfLines={2}
              fontSize={9.5}
              fontFamily="Medium"
              style={orderStyles.label}
            >
              {item?.drop?.address}
            </CustomText>
          </View>
        </View>
      </View>

      <View style={[commonStyles?.flexRowGap]}>
        <View>
          <CustomText
            fontFamily="Medium"
            fontSize={9}
            style={orderStyles.label}
          >
            Pickup
          </CustomText>

          <CustomText fontSize={11} fontFamily="SemiBold">
            {(location &&
              calculateDistance(
                item?.pickup?.latitude,
                item?.pickup?.longitude,
                location?.latitude,
                location?.longitude
              ).toFixed(2)) ||
              "--"}{" "}
            Km
          </CustomText>
        </View>

        <View style={orderStyles.borderLine}>
          <CustomText
            fontSize={9}
            fontFamily="Medium"
            style={orderStyles.label}
          >
            Drop
          </CustomText>
          <CustomText fontSize={11} fontFamily="SemiBold">
            {item?.distance.toFixed(2)} Km
          </CustomText>
        </View>
      </View>

      <View style={orderStyles?.flexRowEnd}>
        <TouchableOpacity onPress={cancelRide}>
          <Ionicons name="close-circle" size={24} color="red" />
        </TouchableOpacity>

        <CounterButton
          onCountdownEnd={removeIt}
          initialCount={30}
          onPress={acceptRide}
          title={!isVehicleMatch ? "Locked" : isTooFar ? "Too Far" : "Accept"}
          disabled={!isVehicleMatch || !!isTooFar}
        />
      </View>
    </Animated.View>
  );
};

export default memo(RiderRidesItem);
