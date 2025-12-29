import { View, Text, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { useRiderStore } from "@/store/riderStore";
import { useWS } from "@/service/WSProvider";
import { useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { resetAndNavigate } from "@/utils/Helpers";
import { StatusBar } from "expo-status-bar";
import { rideStyles } from "@/styles/rideStyles";
import RiderLiveTracking from "@/components/rider/RiderLiveTracking";
import { updateRideStatus, cancelRideOffer } from "@/service/rideService";
import RiderActionButton from "@/components/rider/RiderActionButton";
import OtpInputModal from "@/components/rider/OtpInputModal";
import CustomText from "@/components/shared/CustomText";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import PassengerListModal from "@/components/rider/PassengerListModal";
import PassengerJoinRequestModal from "@/components/rider/PassengerJoinRequestModal";
import { sendAccuracyMetric } from "@/utils/accuracy";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  START: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["COMPLETED"],
};

function isValidTransition(from: string, to: string) {
  return ALLOWED_TRANSITIONS[from]?.includes(to);
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LiveRide = () => {
  const [isOtpModalVisible, setOtpModalVisible] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [acceptingPassengers, setAcceptingPassengers] = useState(true);
  const [joinRequest, setJoinRequest] = useState<any>(null);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const { setLocation, location, setOnDuty } = useRiderStore();
  const { emit, on, off } = useWS();
  const [rideData, setRideData] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState(location);
  const route = useRoute() as any;
  const params = route?.params || {};
  const id = params.id;

  const handleCancelRide = async () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            const success = await cancelRideOffer(id);
            if (success) {
              Alert.alert("Ride Cancelled", "The ride has been cancelled successfully.");
              resetAndNavigate("/rider/home");
            }
          },
        },
      ]
    );
  };

  const handleUpdatePassengerStatus = async (passengerId: string, status: string) => {
    try {
      console.log(`🔄 Updating passenger ${passengerId} status to ${status} via WebSocket`);
      
      // Use WebSocket instead of HTTP - no auth token needed!
      emit("updatePassengerStatus", {
        rideId: id,
        passengerId: passengerId,
        status: status
      });
      
      console.log(`✅ Status update request sent via WebSocket`);
    } catch (error) {
      console.error("Error updating passenger status:", error);
      Alert.alert("Error", "Failed to update passenger status");
    }
  };

  const handleRemovePassenger = async (passengerId: string) => {
    try {
      console.log(`🗑️ Removing passenger ${passengerId} via WebSocket`);
      
      // Use WebSocket instead of HTTP - no auth token needed!
      emit("removePassenger", {
        rideId: id,
        passengerId: passengerId
      });
      
      console.log(`✅ Remove passenger request sent via WebSocket`);
    } catch (error) {
      console.error("Error removing passenger:", error);
      Alert.alert("Error", "Failed to remove passenger");
    }
  };

  const handleToggleAcceptingPassengers = async () => {
    try {
      console.log(`🔄 Toggling accepting passengers via WebSocket`);
      
      // Use WebSocket instead of HTTP - no auth token needed!
      emit("toggleAcceptingPassengers", {
        rideId: id
      });
      
      console.log(`✅ Toggle accepting request sent via WebSocket`);
    } catch (error: any) {
      console.error("Error toggling accepting passengers:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const handleApproveJoinRequest = async () => {
    if (!joinRequest) {
      console.error("❌ No join request data available");
      return;
    }

    try {
      console.log("✅ Approving join request via WebSocket for passenger:", joinRequest.passenger.userId);
      
      // Use WebSocket instead of HTTP - no auth token needed!
      emit("approveJoinRequest", {
        rideId: joinRequest.rideId,
        passengerId: joinRequest.passenger.userId
      });

      // Close modal immediately - we'll get confirmation via socket
      setShowJoinRequestModal(false);
      setJoinRequest(null);
      
      console.log("✅ Approve request sent via WebSocket");
    } catch (error: any) {
      console.error("❌ Error approving join request:", error);
      Alert.alert("Error", "Failed to approve request");
    }
  };

  const handleDeclineJoinRequest = async () => {
    if (!joinRequest) {
      console.error("❌ No join request data available");
      return;
    }

    try {
      console.log("❌ Declining join request via WebSocket for passenger:", joinRequest.passenger.userId);
      
      // Use WebSocket instead of HTTP - no auth token needed!
      emit("declineJoinRequest", {
        rideId: joinRequest.rideId,
        passengerId: joinRequest.passenger.userId
      });

      // Close modal immediately - we'll get confirmation via socket
      setShowJoinRequestModal(false);
      setJoinRequest(null);
      
      console.log("✅ Decline request sent via WebSocket");
    } catch (error: any) {
      console.error("❌ Error declining join request:", error);
      Alert.alert("Error", "Failed to decline request");
    }
  };

  useEffect(() => {
    let locationSubscription: any;

    const startLocationUpdates = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          console.log("🚀 Starting live location tracking for rider...");
          
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 3000, // Update every 3 seconds for smoother tracking
              distanceInterval: 10, // Update every 10 meters for more precise tracking
            },
            (locationData) => {
              const { latitude, longitude, heading, speed } = locationData.coords;
              
              const newLocation = {
                latitude: latitude,
                longitude: longitude,
                address: "Live Location",
                heading: heading as number,
                speed: speed || 0,
                timestamp: Date.now(),
              };

              // Update both store and local state
              setLocation(newLocation);
              setCurrentLocation(newLocation);
              setOnDuty(true);
              if (location) {
                const errorMeters = haversineDistance(
                  location.latitude,
                  location.longitude,
                  latitude,
                  longitude
                );

                sendAccuracyMetric(emit, "GPS_ACCURACY", errorMeters <= 10, {
                  errorMeters,
                });
              }

              

              // Emit location updates to server
              emit("goOnDuty", {
                latitude: latitude,
                longitude: longitude,
                heading: heading as number,
              });

              emit("updateLocation", {
                latitude,
                longitude,
                heading,
                speed,
                rideId: id,
              });

              sendAccuracyMetric(emit, "WS_EMIT", true);


              console.log(
                `🏍️ Live location: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}, Heading: ${heading?.toFixed(0)}°, Speed: ${speed?.toFixed(1)} m/s`
              );
            }
          );
        } else {
          console.log("❌ Location permission denied");
          Alert.alert("Permission Required", "Location permission is required for live tracking");
        }
      } catch (error) {
        console.error("❌ Error starting location tracking:", error);
      }
    };

    startLocationUpdates();

    return () => {
      if (locationSubscription) {
        console.log("🛑 Stopping live location tracking");
        locationSubscription.remove();
      }
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      emit("subscribeRide", id);

      on("rideData", (data) => {
        setRideData(data);
        if (data?.acceptingNewPassengers !== undefined) {
          setAcceptingPassengers(data.acceptingNewPassengers);
        }
      });

      on("passengerUpdate", (data) => {
        console.log("👥 Passenger update received:", data);
        setRideData(data);
        if (data?.acceptingNewPassengers !== undefined) {
          setAcceptingPassengers(data.acceptingNewPassengers);
        }
      });

      on("passengerJoinRequest", (data) => {
        console.log("📨 Passenger join request received:", data);
        setJoinRequest(data);
        setShowJoinRequestModal(true);
      });

      on("newPassengerJoined", (data) => {
        console.log("👥 New passenger joined:", data.passenger);
        Alert.alert(
          "New Passenger",
          `${data.passenger.firstName} ${data.passenger.lastName} has joined the ride!`,
          [{ text: "OK" }]
        );
      });

      on("rideCanceled", (data) => {
        console.log("Ride canceled:", data);
        // CRITICAL: Only show alert if this is OUR ride
        const cancelledRideId = data?.ride?._id || data?.rideId;
        if (cancelledRideId === id) {
          resetAndNavigate("/rider/home");
          Alert.alert("Ride Canceled", data?.message || "The ride has been canceled");
        } else {
          console.log(`Ignoring cancellation for different ride: ${cancelledRideId} (our ride: ${id})`);
        }
      });

      on("passengerCancelledRide", (data) => {
        console.log("Passenger cancelled ride:", data);
        // CRITICAL: Only show alert if this is OUR ride
        if (data?.rideId === id) {
          Alert.alert(
            "Passenger Cancelled Ride",
            `${data.passengerName} has cancelled the ride. You will be redirected to the home screen.`,
            [
              {
                text: "OK",
                onPress: () => {
                  resetAndNavigate("/rider/home");
                }
              }
            ]
          );
        } else {
          console.log(`Ignoring passenger cancellation for different ride: ${data?.rideId} (our ride: ${id})`);
        }
      });

      on("rideData", (data) => {
      sendAccuracyMetric(emit, "WS_RECEIVE", true);
      setRideData(data);

      });

      on("error", (error) => {
        console.log("Ride error:", error);
        resetAndNavigate("/rider/home");
        Alert.alert("Oh Dang! There was an error");
      });

      // Listen for join request approval success
      on("joinRequestApproveSuccess", (data) => {
        console.log("✅ Join request approved successfully:", data);
        Alert.alert("Success", "Passenger has been added to your ride!");
      });

      // Listen for join request decline success
      on("joinRequestDeclineSuccess", (data) => {
        console.log("✅ Join request declined successfully:", data);
        Alert.alert("Declined", "Join request has been declined");
      });

      // Listen for join request errors
      on("joinRequestError", (data) => {
        console.error("❌ Join request error:", data);
        Alert.alert("Error", data.message || "Failed to process join request");
      });

      // Listen for passenger status update success
      on("passengerStatusUpdateSuccess", (data) => {
        console.log("✅ Passenger status updated successfully:", data);
      });

      // Listen for passenger status update errors
      on("passengerStatusError", (data) => {
        console.error("❌ Passenger status error:", data);
        Alert.alert("Error", data.message || "Failed to update passenger status");
      });

      // Listen for remove passenger success
      on("removePassengerSuccess", (data) => {
        console.log("✅ Passenger removed successfully:", data);
      });

      // Listen for remove passenger errors
      on("removePassengerError", (data) => {
        console.error("❌ Remove passenger error:", data);
        Alert.alert("Error", data.message || "Failed to remove passenger");
      });

      // Listen for toggle accepting success
      on("toggleAcceptingSuccess", (data) => {
        console.log("✅ Toggle accepting success:", data);
        setAcceptingPassengers(data.acceptingNewPassengers);
        Alert.alert("Success", data.message);
      });

      // Listen for toggle accepting errors
      on("toggleAcceptingError", (data) => {
        console.error("❌ Toggle accepting error:", data);
        Alert.alert("Error", data.message || "Failed to toggle accepting passengers");
      });
    }

    return () => {
      off("rideData");
      off("rideCanceled");
      off("passengerCancelledRide");
      off("rideUpdate");
      off("error");
      off("passengerUpdate");
      off("newPassengerJoined");
      off("passengerJoinRequest");
      off("joinRequestApproveSuccess");
      off("joinRequestDeclineSuccess");
      off("joinRequestError");
      off("passengerStatusUpdateSuccess");
      off("passengerStatusError");
      off("removePassengerSuccess");
      off("removePassengerError");
      off("toggleAcceptingSuccess");
      off("toggleAcceptingError");
    };
  }, [id, emit, on, off]);

  return (
    <View style={rideStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />

      {rideData && (
        <View style={{ flex: 1 }}>
          <RiderLiveTracking
            status={rideData?.status}
            drop={{
              latitude: parseFloat(rideData?.drop.latitude),
              longitude: parseFloat(rideData?.drop.longitude),
            }}
            pickup={{
              latitude: parseFloat(rideData?.pickup.latitude),
              longitude: parseFloat(rideData?.pickup.longitude),
            }}
            rider={{
              latitude: currentLocation?.latitude || location?.latitude,
              longitude: currentLocation?.longitude || location?.longitude,
              heading: currentLocation?.heading || location?.heading,
            }}
            vehicleType={rideData?.vehicle}
          />

          {/* Minimal Passenger Counter - Top Left */}
          {(rideData?.status === "START" || rideData?.status === "ARRIVED") && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 60,
                left: 20,
                backgroundColor: '#4CAF50',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                zIndex: 1000,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
              onPress={() => setShowPassengerModal(true)}
            >
              <Ionicons name="people" size={18} color="white" />
              <CustomText fontSize={14} fontFamily="Bold" style={{ color: 'white' }}>
                {rideData?.passengers?.filter((p: any) => p.status === 'ONBOARD').length || 0} Onboard
              </CustomText>
            </TouchableOpacity>
          )}

          {/* Toggle Accepting Passengers Button */}
          {(rideData?.status === "START" || rideData?.status === "ARRIVED") && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 140,
                left: 20,
                backgroundColor: acceptingPassengers ? '#2196F3' : '#9E9E9E',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                zIndex: 1000,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
              onPress={handleToggleAcceptingPassengers}
            >
              <Ionicons
                name={acceptingPassengers ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color="white"
              />
              <CustomText fontSize={10} style={{ color: 'white' }}>
                {acceptingPassengers ? 'Accepting' : 'Not Accepting'}
              </CustomText>
            </TouchableOpacity>
          )}

          {/* Cancel Button Overlay - Repositioned to top-right */}
          <View style={{
            position: 'absolute',
            top: 60,
            right: 20,
            zIndex: 1000,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#ff4444',
                padding: 14,
                borderRadius: 30,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'white',
              }}
              onPress={handleCancelRide}
            >
              <Ionicons name="close" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <RiderActionButton
        ride={rideData}
        riderLocation={
          currentLocation?.latitude && currentLocation?.longitude
            ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
            : location?.latitude && location?.longitude
            ? { latitude: location.latitude, longitude: location.longitude }
            : undefined
        }
        title={
          rideData?.status === "START"
            ? "ARRIVED"
            : rideData?.status === "ARRIVED"
            ? "COMPLETED"
            : "SUCCESS"
        }
        onPress={async () => {
          if (rideData?.status === "START") {
            setOtpModalVisible(true);
            return;
          }
          const isSuccess = await updateRideStatus(rideData?._id, "COMPLETED");
          if (isSuccess) {
            Alert.alert("Congratulations! Ride Completed 🎉");
            resetAndNavigate("/rider/home");
          } else {
            Alert.alert("There was an error");
          }
        }}
        onOpenPassengerModal={() => setShowPassengerModal(true)}
        color="#228B22"
      />

      <OtpInputModal
        visible={isOtpModalVisible}
        onClose={() => setOtpModalVisible(false)}
        title="Enter OTP Below"
        onConfirm={async (otp) => {
          const validTransition = isValidTransition(rideData.status, "ARRIVED");

          sendAccuracyMetric(emit, "FSM_TRANSITION", validTransition, {
            from: rideData.status,
            to: "ARRIVED",
          });

          if (!validTransition) {
            Alert.alert("Invalid state transition");
            return;
          }

          const otpCorrect = otp === rideData?.otp;

          sendAccuracyMetric(emit, "OTP_VALIDATION", otpCorrect);

          if (!otpCorrect) {
            Alert.alert("Wrong OTP");
            return;
          }

          const isSuccess = await updateRideStatus(
            rideData?._id,
            "ARRIVED"
          );

          if (isSuccess) {
            setOtpModalVisible(false);
          } else {
            Alert.alert("Technical Error");
          }
        }}
      />


      {/* Passenger Management Modal */}
      {rideData && (
        <PassengerListModal
          visible={showPassengerModal}
          onClose={() => setShowPassengerModal(false)}
          passengers={rideData?.passengers || []}
          onUpdateStatus={handleUpdatePassengerStatus}
          onRemovePassenger={handleRemovePassenger}
          isRider={true}
        />
      )}

      {/* Passenger Join Request Modal */}
      <PassengerJoinRequestModal
        visible={showJoinRequestModal}
        passengerDetails={joinRequest?.passenger}
        rideDetails={joinRequest?.ride}
        onApprove={handleApproveJoinRequest}
        onDecline={handleDeclineJoinRequest}
      />
    </View>
  );
};

export default LiveRide;
