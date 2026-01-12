import { View, Text, TouchableOpacity, Image, Platform } from "react-native";
import React, { FC, memo, useEffect, useRef, useState, useMemo } from "react";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { indiaIntialRegion } from "@/utils/CustomMap";
import CustomText from "../shared/CustomText";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { mapStyles } from "@/styles/mapStyles";
import MapViewDirections from "react-native-maps-directions";
import { Colors } from "@/utils/Constants";
import { getPoints } from "@/utils/mapUtils";
import { sendAccuracyMetric } from "@/utils/accuracy";


const apikey = process.env.EXPO_PUBLIC_MAP_API_KEY || "";

const RiderLiveTracking: FC<{
  drop: any;
  pickup: any;
  rider: any;
  status: string;
  vehicleType?: string;
  passengers?: any[];
}> = ({ drop, status, pickup, rider, vehicleType, passengers = [] }) => {
  const mapRef = useRef<MapView>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Calculate active targets (Pickups for WAITING, Drops for ONBOARD)
  const activeTargets = useMemo(() => {
    const targets: any[] = [];

    passengers.forEach(p => {
      if (p.status === 'WAITING' && p.pickup) {
        targets.push({
          type: 'PICKUP',
          latitude: p.pickup.latitude,
          longitude: p.pickup.longitude,
          address: p.pickup.address,
          passengerName: `${p.firstName} ${p.lastName}`,
          id: p.userId?._id || p.userId
        });
      } else if (p.status === 'ONBOARD' && p.drop) {
        targets.push({
          type: 'DROP',
          latitude: p.drop.latitude,
          longitude: p.drop.longitude,
          address: p.drop.address,
          passengerName: `${p.firstName} ${p.lastName}`,
          id: p.userId?._id || p.userId
        });
      }
    });

    return targets;
  }, [passengers]);

  // Find the closest target to the rider
  const closestTarget = useMemo(() => {
    if (!rider?.latitude || activeTargets.length === 0) return null;

    let closest = activeTargets[0];
    let minDistance = Infinity;

    activeTargets.forEach(target => {
      const dist = Math.sqrt(
        Math.pow(target.latitude - rider.latitude, 2) +
        Math.pow(target.longitude - rider.longitude, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = target;
      }
    });

    return closest;
  }, [rider, activeTargets]);

  const fitToMarkers = async () => {
    if (isUserInteracting) return;

    const coordinates = [];

    activeTargets.forEach(t => {
      coordinates.push({ latitude: t.latitude, longitude: t.longitude });
    });

    if (rider?.latitude && rider?.longitude) {
      coordinates.push({
        latitude: rider.latitude,
        longitude: rider.longitude,
      });
    }

    if (coordinates.length === 0) {
      if (pickup?.latitude) coordinates.push({ latitude: pickup.latitude, longitude: pickup.longitude });
      if (drop?.latitude) coordinates.push({ latitude: drop.latitude, longitude: drop.longitude });
    }

    if (coordinates.length === 0) return;

    try {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } catch (error) {
      console.error("Error fitting to markers:", error);
    }
  };

  const fitToMarkersWithDelay = () => {
    setTimeout(() => {
      fitToMarkers();
    }, 500);
  };

  const calculateInitialRegion = () => {
    if (pickup?.latitude && drop?.latitude) {
      const latitude = (pickup.latitude + drop.latitude) / 2;
      const longitude = (pickup.longitude + drop.longitude) / 2;
      console.log("🗺️ Calculated region:", { latitude, longitude });
      return {
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    if (rider?.latitude && rider?.longitude) {
      console.log("🗺️ Using rider location:", rider);
      return {
        latitude: rider.latitude,
        longitude: rider.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    console.log("🗺️ Using Digos City fallback region");
    return {
      latitude: 6.7499,
      longitude: 125.3575,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  };

  useEffect(() => {
    console.log("🗺️ RiderLiveTracking - Pickup:", pickup);
    console.log("🗺️ RiderLiveTracking - Drop:", drop);
    console.log("🗺️ RiderLiveTracking - Rider:", rider);
    console.log("🗺️ RiderLiveTracking - Status:", status);
    console.log("🗺️ RiderLiveTracking - API Key:", apikey ? "Present" : "Missing");

    if (pickup?.latitude && drop?.latitude) fitToMarkers();
  }, [drop?.latitude, pickup?.latitude, rider?.latitude]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={calculateInitialRegion()}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={false}
        showsPointsOfInterest={true}
        mapType="standard"
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        onRegionChange={() => setIsUserInteracting(true)}
        onRegionChangeComplete={() => setIsUserInteracting(false)}
        onMapReady={() => {
          console.log("🗺️ Rider map is ready with Google provider!");
          console.log("🗺️ Map region:", calculateInitialRegion());
          setTimeout(() => fitToMarkers(), 1500);
        }}
        loadingEnabled={true}
        loadingIndicatorColor="#007AFF"
        loadingBackgroundColor="#ffffff"
      >
        {rider?.latitude && closestTarget && (
          <MapViewDirections
            origin={{ latitude: rider.latitude, longitude: rider.longitude }}
            destination={{ latitude: closestTarget.latitude, longitude: closestTarget.longitude }}
            onReady={fitToMarkersWithDelay}
            apikey={apikey}
            strokeColor={Colors.iosColor}
            strokeWidth={5}
            precision="high"
            optimizeWaypoints={true}
            onError={(error) => console.log("Directions error:", error)}
          />
        )}

        {activeTargets.map((target, index) => (
          <Marker
            key={`${target.id}-${target.type}`}
            coordinate={{ latitude: target.latitude, longitude: target.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={target.type === 'PICKUP' ? 2 : 1}
            title={`${target.passengerName} (${target.type})`}
            description={target.address}
          >
            <Image
              source={
                target.type === 'PICKUP'
                  ? require("@/assets/icons/marker.png")
                  : require("@/assets/icons/drop_marker.png")
              }
              style={{ height: 30, width: 30, resizeMode: "contain" }}
            />
          </Marker>
        ))}

        {rider?.latitude && (
          <Marker
            coordinate={{
              latitude: rider.latitude,
              longitude: rider.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={3}
          >
            <View style={{ transform: [{ rotate: `${rider?.heading || 0}deg` }] }}>
              <Image
                source={
                  vehicleType === "Tricycle"
                    ? require("@/assets/icons/auto_marker.png")
                    : require("@/assets/icons/auto_marker.png") // Default to Tricycle
                }
                style={{ height: 40, width: 40, resizeMode: "contain" }}
              />
            </View>
          </Marker>
        )}
      </MapView>

      <TouchableOpacity style={mapStyles.gpsLiveButton} onPress={() => { }}>
        <CustomText fontFamily="SemiBold" fontSize={10}>
          Open Live GPS
        </CustomText>
        <FontAwesome6 name="location-arrow" size={RFValue(12)} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={mapStyles.gpsButton} onPress={fitToMarkers}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={RFValue(16)}
          color="#3C75BE"
        />
      </TouchableOpacity>
    </View>
  );
};

export default memo(RiderLiveTracking);
