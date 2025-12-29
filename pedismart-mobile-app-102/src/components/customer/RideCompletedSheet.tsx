import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import React, { FC, useState, useEffect } from "react";
import { rideStyles } from "@/styles/rideStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { vehicleIcons } from "@/utils/mapUtils";
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { resetAndNavigate } from "@/utils/Helpers";
import AnonymousRatingModal from "./AnonymousRatingModal";

type VehicleType = "Tricycle"; // Commented out: "Single Motorcycle" | "Cab"

interface RideItem {
  _id: string;
  vehicle?: VehicleType;
  pickup?: { address: string };
  drop?: { address: string };
  fare?: number;
  otp?: string;
  rider: any;
  status: string;
}

interface RideCompletedSheetProps {
  item: RideItem;
  onNavigateHome?: () => void;
  isDroppedPassenger?: boolean;
}

const RideCompletedSheet: FC<RideCompletedSheetProps> = ({ item, onNavigateHome, isDroppedPassenger = false }) => {
  const [countdown, setCountdown] = useState(10);
  // CRITICAL: Disable auto-navigation for dropped passengers
  const [isAutoNavigating, setIsAutoNavigating] = useState(!isDroppedPassenger);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  useEffect(() => {
    // Only auto-navigate if NOT a dropped passenger
    if (isAutoNavigating && countdown > 0 && !isDroppedPassenger) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isAutoNavigating && !isDroppedPassenger) {
      handleCleanupAndNavigate();
    }
  }, [countdown, isAutoNavigating, isDroppedPassenger]);

  const handleCleanupAndNavigate = () => {
    console.log('🧹 Cleaning up socket listeners and navigating to home');
    setIsAutoNavigating(false);
    // Call the cleanup function passed from parent
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      resetAndNavigate("/customer/home");
    }
  };

  const handleManualNavigation = () => {
    setIsAutoNavigating(false);
    handleCleanupAndNavigate();
  };

  const cancelAutoNavigation = () => {
    setIsAutoNavigating(false);
  };

  return (
    <View style={{ flex: 1, paddingBottom: 20 }}>
      {/* Back Button - Hidden for dropped passengers */}
      {!isDroppedPassenger && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 8,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
          onPress={handleCleanupAndNavigate}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      )}

      {/* Success Header with Ride ID */}
      <View style={[
        rideStyles?.headerContainer, 
        { 
          backgroundColor: '#4CAF50', 
          borderRadius: 12, 
          margin: 10,
          marginTop: 15,
          padding: 6,
          shadowColor: '#4CAF50',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }
      ]}>
        <View style={[commonStyles.flexRowGap, { alignItems: 'center', marginBottom: 4 }]}>
          <Ionicons name="checkmark-circle" size={48} color="white" />
          <View style={{ flex: 1 }}>
            <CustomText fontSize={18} fontFamily="Bold" style={{ color: 'white' }}>
              {isDroppedPassenger ? "You've Been Dropped Off! 🎉" : "Ride Completed! 🎉"}
            </CustomText>
            <CustomText fontSize={13} style={{ color: 'white', opacity: 0.95, marginTop: 4 }}>
              {isDroppedPassenger ? "Please use the back button to return home" : "Thank you for using our service"}
            </CustomText>
          </View>
        </View>
        
        {/* Ride ID inside green header */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          padding: 10,
          borderLeftWidth: 0,
          
          marginRight: 130,
          borderLeftColor: 'rgba(255, 255, 255, 0.5)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="identifier" size={16} color="white" style={{ marginRight: 6 }} />
            <CustomText fontSize={10} fontFamily="SemiBold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Ride ID:
            </CustomText>
          </View>
          <CustomText fontSize={11} fontFamily="Medium" style={{ color: 'white', marginTop: 4 }} numberOfLines={1}>
            {item._id}
          </CustomText>
        </View>
      </View>

      {/* Ride Summary */}
      <View style={{ paddingHorizontal: 10 }}>
        <CustomText fontFamily="Bold" fontSize={16} style={{ marginBottom: 12, marginTop: 4 }}>
          Ride Summary
        </CustomText>

        {/* Combined Rider & Vehicle Info Card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#e0e0e0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          {/* Vehicle Type Header */}
          <View style={[commonStyles.flexRowGap, { alignItems: 'center', marginBottom: 12 }]}>
            {item.vehicle && (
              <Image
                source={vehicleIcons[item.vehicle]?.icon}
                style={[rideStyles.rideIcon, { width: 45, height: 45 }]}
              />
            )}
            <View style={{ flex: 1 }}>
              <CustomText fontSize={15} fontFamily="Bold" style={{ color: '#333' }}>
                {item?.vehicle} Ride
              </CustomText>
              <CustomText fontSize={11} style={{ color: '#4CAF50', marginTop: 2 }}>
                ✓ Completed Successfully
              </CustomText>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 10 }} />

          {/* Rider Info Section */}
          {item?.rider && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="account-circle" size={20} color="#2196F3" style={{ marginRight: 6 }} />
                <CustomText fontFamily="Bold" fontSize={12} style={{ color: '#2196F3' }}>
                  Your Rider
                </CustomText>
              </View>
              <CustomText fontFamily="Bold" fontSize={16} style={{ color: '#333', marginBottom: 6 }}>
                {item.rider.firstName && item.rider.lastName 
                  ? `${item.rider.firstName} ${item.rider.lastName}`
                  : item.rider.name || 'N/A'}
              </CustomText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {item.rider.phone && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="call" size={14} color="#666" style={{ marginRight: 4 }} />
                    <CustomText fontSize={12} style={{ color: '#666' }}>
                      {item.rider.phone.slice(0, 5)} {item.rider.phone.slice(5)}
                    </CustomText>
                  </View>
                )}
                {item.rider.vehicleType && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="bicycle" size={14} color="#666" style={{ marginRight: 4 }} />
                    <CustomText fontSize={12} style={{ color: '#666' }}>
                      {item.rider.vehicleType}
                    </CustomText>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Location Details Card - Compact */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#e0e0e0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MaterialCommunityIcons name="map-marker-path" size={20} color="#333" style={{ marginRight: 6 }} />
            <CustomText fontFamily="Bold" fontSize={13} style={{ color: '#333' }}>
              Trip Route
            </CustomText>
          </View>
          
          {/* Pickup Location */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 6,
            }}>
              <View style={{
                backgroundColor: '#e8f5e9',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Image
                  source={require("@/assets/icons/marker.png")}
                  style={[rideStyles.pinIcon, { width: 16, height: 16, marginRight: 4 }]}
                />
                <CustomText fontSize={11} fontFamily="Bold" style={{ color: '#2e7d32' }}>
                  FROM
                </CustomText>
              </View>
            </View>
            <CustomText fontSize={12} style={{ color: '#333', lineHeight: 18, paddingLeft: 4 }}>
              {item?.pickup?.address || 'N/A'}
            </CustomText>
          </View>

          {/* Connecting Arrow */}
          <View style={{ paddingLeft: 4, marginVertical: -2 }}>
            <MaterialCommunityIcons name="arrow-down" size={18} color="#bdbdbd" />
          </View>

          {/* Drop Location */}
          <View style={{ marginTop: 8 }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 6,
            }}>
              <View style={{
                backgroundColor: '#fff3e0',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Image
                  source={require("@/assets/icons/drop_marker.png")}
                  style={[rideStyles.pinIcon, { width: 16, height: 16, marginRight: 4 }]}
                />
                <CustomText fontSize={11} fontFamily="Bold" style={{ color: '#e65100' }}>
                  TO
                </CustomText>
              </View>
            </View>
            <CustomText fontSize={12} style={{ color: '#333', lineHeight: 18, paddingLeft: 4 }}>
              {item?.drop?.address || 'N/A'}
            </CustomText>
          </View>
        </View>

        {/* COMMENTED OUT: Payment/Fare - Driver handles pricing manually
        Payment Summary
        <View style={{ 
          backgroundColor: '#f5f5f5', 
          padding: 15, 
          borderRadius: 10, 
          marginVertical: 10 
        }}>
          <View style={[commonStyles.flexRowBetween, { marginBottom: 10 }]}>
            <View style={commonStyles.flexRow}>
              <MaterialCommunityIcons
                name="credit-card"
                size={24}
                color="#4CAF50"
              />
              <CustomText
                style={{ marginLeft: 10 }}
                fontFamily="SemiBold"
                fontSize={14}
              >
                Total Payment
              </CustomText>
            </View>

            <CustomText fontFamily="Bold" fontSize={18} style={{ color: '#4CAF50' }}>
              ₱ {item.fare?.toFixed(2)}
            </CustomText>
          </View>

          <CustomText fontSize={11} style={{ color: '#666' }}>
            Payment via cash - Paid to rider
          </CustomText>
        </View>
        */}

        {/* Rating Section - Compact */}
        <TouchableOpacity
          onPress={() => setRatingModalVisible(true)}
          style={{ 
            backgroundColor: '#fff3cd', 
            padding: 12, 
            borderRadius: 10, 
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#ffc107',
            shadowColor: '#ffc107',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <View style={[commonStyles.flexRowBetween, { alignItems: 'center' }]}>
            <View style={{ flex: 1, marginRight: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={20} color="#ffc107" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <CustomText fontFamily="Bold" fontSize={13} style={{ color: '#856404' }}>
                  Rate Your Experience
                </CustomText>
                <CustomText fontSize={10} style={{ color: '#856404', opacity: 0.85, marginTop: 2 }}>
                  🔒 Anonymous rating
                </CustomText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffc107" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Auto-Navigation Countdown */}
      {isAutoNavigating && countdown > 0 && (
        <View style={{ 
          backgroundColor: '#e3f2fd', 
          padding: 16, 
          borderRadius: 12, 
          marginHorizontal: 10,
          marginBottom: 12,
          borderLeftWidth: 5,
          borderLeftColor: '#2196F3',
          shadowColor: '#2196F3',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={[commonStyles.flexRowBetween, { alignItems: 'center' }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="time" size={18} color="#1976D2" style={{ marginRight: 6 }} />
                <CustomText fontFamily="Bold" fontSize={14} style={{ color: '#1976D2' }}>
                  Redirecting in {countdown}s
                </CustomText>
              </View>
              <CustomText fontSize={11} style={{ color: '#1565C0', marginTop: 2 }}>
                You'll be taken back to the home screen
              </CustomText>
            </View>
            <TouchableOpacity
              onPress={cancelAutoNavigation}
              style={{ 
                backgroundColor: '#fff', 
                paddingHorizontal: 14, 
                paddingVertical: 8, 
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: '#2196F3'
              }}
            >
              <CustomText fontSize={11} fontFamily="SemiBold" style={{ color: '#2196F3' }}>Cancel</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={[rideStyles.bottomButtonContainer, { paddingHorizontal: 10, paddingBottom: 10 }]}>
        <TouchableOpacity
          style={[
            rideStyles.backButton2, 
            { 
              backgroundColor: '#4CAF50', 
              flex: 1,
              paddingVertical: 16,
              borderRadius: 12,
              shadowColor: '#4CAF50',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 5,
            }
          ]}
          onPress={handleManualNavigation}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons 
              name={isAutoNavigating ? 'home' : 'add-circle'} 
              size={20} 
              color="white" 
              style={{ marginRight: 8 }} 
            />
            <CustomText style={[rideStyles.backButtonText, { color: 'white', fontSize: 16, fontWeight: 'bold' }]}>
              {isAutoNavigating ? 'Go to Home Now' : 'Book Another Ride'}
            </CustomText>
          </View>
        </TouchableOpacity>
      </View>

      {/* Anonymous Rating Modal */}
      <AnonymousRatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        rideId={item._id}
        riderName={
          item?.rider?.firstName && item?.rider?.lastName 
            ? `${item.rider.firstName} ${item.rider.lastName}`
            : item?.rider?.name || 'Rider'
        }
      />
    </View>
  );
};

export default RideCompletedSheet;
