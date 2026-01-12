import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../shared/CustomText';
import PassengerIndicator from '../shared/PassengerIndicator';
import { joinRide } from '@/service/rideService';
import { router } from 'expo-router';

interface AvailableRideCardProps {
  ride: any;
  onJoinSuccess?: () => void;
  joinerPickup?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  joinerDrop?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

const AvailableRideCard: React.FC<AvailableRideCardProps> = ({
  ride,
  onJoinSuccess,
  joinerPickup,
  joinerDrop
}) => {
  const [joining, setJoining] = React.useState(false);

  const handleJoin = async () => {
    if (joining) return;

    Alert.alert(
      'Join Ride',
      `Join this ride from ${ride.pickup?.address?.substring(0, 30)}... to ${ride.drop?.address?.substring(0, 30)}...?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            try {
              setJoining(true);
              console.log(`🚗 Sending join request for ride: ${ride._id}`);

              const payload = {
                pickup: joinerPickup,
                drop: joinerDrop
              };

              const response = await joinRide(ride._id, payload);
              if (response) {
                console.log('✅ Join request sent, waiting for rider approval');
                Alert.alert(
                  'Request Sent',
                  'Your join request has been sent to the rider. Please wait for approval.',
                  [{ text: 'OK' }]
                );
                onJoinSuccess?.();
              }
            } catch (error) {
              console.error('❌ Error sending join request:', error);
            } finally {
              setJoining(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SEARCHING_FOR_RIDER':
        return '#FF9800';
      case 'START':
        return '#2196F3';
      case 'ARRIVED':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SEARCHING_FOR_RIDER':
        return 'Looking for rider';
      case 'START':
        return 'On the way';
      case 'ARRIVED':
        return 'In progress';
      default:
        return status;
    }
  };

  const isFull = ride.currentPassengerCount >= ride.maxPassengers;
  const isRouteMissing = !joinerPickup || !joinerDrop;

  return (
    <View style={styles.card}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
        <CustomText fontSize={8} style={styles.statusText}>
          {getStatusText(ride.status)}
        </CustomText>
      </View>

      {/* Route Info */}
      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <Ionicons name="location" size={14} color="#4CAF50" />
          <CustomText fontSize={10} numberOfLines={1} style={styles.routeText}>
            {ride.pickup?.address}
          </CustomText>
        </View>
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-down" size={12} color="#666" />
        </View>
        <View style={styles.routeRow}>
          <Ionicons name="flag" size={14} color="#f44336" />
          <CustomText fontSize={10} numberOfLines={1} style={styles.routeText}>
            {ride.drop?.address}
          </CustomText>
        </View>
      </View>

      {/* Distance */}
      <View style={styles.infoRow}>
        <Ionicons name="navigate" size={12} color="#666" />
        <CustomText fontSize={9} style={styles.infoText}>
          {ride.distance?.toFixed(1)} km
        </CustomText>
      </View>

      {/* Passenger Indicator */}
      <View style={styles.passengerContainer}>
        <PassengerIndicator
          currentCount={ride.currentPassengerCount || 1}
          maxCount={ride.maxPassengers || 6}
          size="small"
          showLabel={false}
        />
      </View>

      {/* Join Button */}
      <TouchableOpacity
        style={[
          styles.joinButton,
          (isFull || joining || isRouteMissing) && styles.joinButtonDisabled,
        ]}
        onPress={handleJoin}
        disabled={isFull || joining || isRouteMissing}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isRouteMissing ? "warning-outline" : "add-circle"}
          size={16}
          color="#fff"
        />
        <CustomText fontSize={10} fontFamily="SemiBold" style={styles.joinButtonText}>
          {joining ? 'Sending...' :
            isFull ? 'Full' :
              isRouteMissing ? 'Confirm Route Above' : 'Request to Join'}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  routeContainer: {
    marginBottom: 8,
    paddingRight: 60,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  arrowContainer: {
    paddingLeft: 7,
    marginVertical: 2,
  },
  routeText: {
    color: '#333',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  infoText: {
    color: '#666',
  },
  passengerContainer: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  joinButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  joinButtonText: {
    color: '#fff',
  },
});

export default AvailableRideCard;
