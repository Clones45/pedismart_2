import { View, Text, TouchableOpacity } from "react-native";
import React, { FC, useState, useEffect, useMemo } from "react";
import { Colors } from "@/utils/Constants";
import { Ionicons } from "@expo/vector-icons";
import SwipeButton from "rn-swipe-button";
import { rideStyles } from "@/styles/rideStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { orderStyles } from "@/styles/riderStyles";
import { RFValue } from "react-native-responsive-fontsize";
import { useReverseGeocoding } from "@/hooks/useReverseGeocoding";

const RiderActionButton: FC<{
  ride: any;
  color?: string;
  title: string;
  onPress: () => void;
  riderLocation?: { latitude: number; longitude: number };
  onOpenPassengerModal?: () => void;
}> = ({ ride, color = Colors.iosColor, title, onPress, riderLocation, onOpenPassengerModal }) => {
  const [eta, setEta] = useState<string>("Calculating...");

  // Calculate active targets (Pickups for WAITING, Drops for ONBOARD)
  const activeTargets = useMemo(() => {
    if (!ride?.passengers) return [];
    const targets: any[] = [];

    ride.passengers.forEach((p: any) => {
      if (p.status === 'WAITING' && p.pickup) {
        targets.push({
          type: 'PICKUP',
          latitude: p.pickup.latitude,
          longitude: p.pickup.longitude,
          address: p.pickup.address,
          passengerName: `${p.firstName} ${p.lastName}`,
          id: p.userId?._id || p.userId,
          phone: p.phone || ""
        });
      } else if (p.status === 'ONBOARD' && p.drop) {
        targets.push({
          type: 'DROP',
          latitude: p.drop.latitude,
          longitude: p.drop.longitude,
          address: p.drop.address,
          passengerName: `${p.firstName} ${p.lastName}`,
          id: p.userId?._id || p.userId,
          phone: p.phone || ""
        });
      }
    });

    return targets;
  }, [ride?.passengers]);

  // Find the closest target to the rider
  const closestTarget = useMemo(() => {
    if (!riderLocation?.latitude || activeTargets.length === 0) return null;

    let closest = activeTargets[0];
    let minDistance = Infinity;

    activeTargets.forEach(target => {
      const dist = Math.sqrt(
        Math.pow(target.latitude - riderLocation.latitude, 2) +
        Math.pow(target.longitude - riderLocation.longitude, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = target;
      }
    });

    return closest;
  }, [riderLocation, activeTargets]);

  // Calculate ETA based on distance and average speed
  const calculateETA = () => {
    if (!riderLocation || (!ride && !closestTarget)) {
      setEta("Calculating...");
      return;
    }

    try {
      // Determine destination based on closest target or fallback to original behavior
      let destination = closestTarget || (ride.status === "START" ? ride.pickup : ride.drop);

      if (!destination?.latitude || !destination?.longitude) {
        setEta("--");
        return;
      }

      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = ((destination.latitude - riderLocation.latitude) * Math.PI) / 180;
      const dLon = ((destination.longitude - riderLocation.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((riderLocation.latitude * Math.PI) / 180) *
        Math.cos((destination.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km

      const averageSpeed = 25; // Average speed in km/h for tricycle
      const timeInHours = distance / averageSpeed;
      const timeInMinutes = Math.ceil(timeInHours * 60);

      if (timeInMinutes < 1) {
        setEta("< 1 min");
      } else if (timeInMinutes === 1) {
        setEta("1 min");
      } else {
        setEta(`${timeInMinutes} mins`);
      }
    } catch (error) {
      console.error("Error calculating ETA:", error);
      setEta("--");
    }
  };

  // Recalculate ETA when rider location or active targets change
  useEffect(() => {
    calculateETA();
    // Update ETA every 10 seconds for real-time accuracy
    const interval = setInterval(calculateETA, 10000);
    return () => clearInterval(interval);
  }, [riderLocation, ride?.status, closestTarget]);

  const CheckoutButton = () => (
    <Ionicons
      name="arrow-forward-sharp"
      style={{ bottom: 2 }}
      size={32}
      color="#fff"
    />
  );


  // Reverse geocode next stop coordinates
  const { address: nextStopAddress } = useReverseGeocoding(
    closestTarget?.latitude || (ride?.status === "START" ? ride?.pickup?.latitude : ride?.drop?.latitude),
    closestTarget?.longitude || (ride?.status === "START" ? ride?.pickup?.longitude : ride?.drop?.longitude),
    closestTarget?.address || (ride?.status === "START" ? ride?.pickup?.address : ride?.drop?.address)
  );

  return (
    <View style={rideStyles?.swipeableContaninerRider}>
      {/* Ride ID and ETA Row */}
      <View style={commonStyles?.flexRowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CustomText
            fontSize={10}
            style={{ color: '#666' }}
            fontFamily="Medium"
          >
            Ride ID:
          </CustomText>
          <CustomText
            fontSize={11}
            style={{ color: Colors.primary }}
            fontFamily="SemiBold"
          >
            #RID{ride?._id?.slice(-8).toUpperCase()}
          </CustomText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <CustomText
            fontSize={11}
            style={{ color: '#666' }}
            fontFamily="Medium"
          >
            ETA:
          </CustomText>
          <CustomText
            fontSize={11}
            style={{ color: Colors.primary }}
            fontFamily="SemiBold"
          >
            {eta}
          </CustomText>
        </View>
      </View>

      <View style={commonStyles?.flexRowBetween}>
        <CustomText
          fontSize={11}
          style={{ marginTop: 10, marginBottom: 3 }}
          numberOfLines={1}
          fontFamily="Medium"
        >
          {closestTarget ? `Next Stop: ${closestTarget.passengerName}` : "Meet the Customer"}
        </CustomText>
        <CustomText
          fontSize={11}
          style={{ marginTop: 10, marginBottom: 3 }}
          numberOfLines={1}
          fontFamily="Medium"
        >
          {" "}
          {(closestTarget?.phone || ride?.customer?.phone) &&
            (closestTarget?.phone || ride?.customer?.phone)?.slice(0, 5) +
            " " +
            (closestTarget?.phone || ride?.customer?.phone)?.slice(5)}
        </CustomText>
      </View>

      {/* Passenger Management Button */}
      {onOpenPassengerModal && ride?.passengers && ride.passengers.length > 0 && (
        <TouchableOpacity
          onPress={onOpenPassengerModal}
          style={{
            backgroundColor: '#4CAF50',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            marginTop: 8,
            marginBottom: 4,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="people" size={18} color="white" />
            <CustomText fontSize={11} fontFamily="SemiBold" style={{ color: 'white' }}>
              Manage Passengers
            </CustomText>
          </View>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.3)',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}>
            <CustomText fontSize={10} fontFamily="Bold" style={{ color: 'white' }}>
              {ride?.passengers?.filter((p: any) => p.status === 'ONBOARD').length || 0}
            </CustomText>
            <CustomText fontSize={9} style={{ color: 'white' }}>
              Onboard
            </CustomText>
          </View>
        </TouchableOpacity>
      )}

      <View style={[orderStyles.locationsContainer, { marginTop: 4 }]}>
        <View style={orderStyles.flexRowBase}>
          <View>
            <View style={closestTarget?.type === 'DROP' ? orderStyles.dropHollowCircle : orderStyles.pickupHollowCircle} />
          </View>
          <View style={orderStyles.infoText}>
            <CustomText fontSize={11} numberOfLines={1} fontFamily="SemiBold">
              {closestTarget?.type || "Next Task"}
            </CustomText>
            <CustomText
              numberOfLines={2}
              fontSize={9.5}
              fontFamily="Medium"
              style={orderStyles.label}
            >
              {nextStopAddress}
            </CustomText>
          </View>
        </View>
      </View>

      <SwipeButton
        containerStyles={rideStyles.swipeButtonContainer}
        height={30}
        shouldResetAfterSuccess={true}
        resetAfterSuccessAnimDelay={200}
        onSwipeSuccess={onPress}
        railBackgroundColor={color}
        railStyles={rideStyles.railStyles}
        railBorderColor="transparent"
        railFillBackgroundColor="rgba(255,255,255,0.6)"
        railFillBorderColor="rgba(255,255,255,0.6)"
        titleColor="#fff"
        titleFontSize={RFValue(13)}
        titleStyles={rideStyles.titleStyles}
        thumbIconComponent={CheckoutButton}
        thumbIconStyles={rideStyles.thumbIconStyles}
        title={title.toUpperCase()}
        thumbIconBackgroundColor="transparent"
        thumbIconBorderColor="transparent"
        thumbIconHeight={50}
        thumbIconWidth={60}
      />
    </View>
  );
};

export default RiderActionButton;
