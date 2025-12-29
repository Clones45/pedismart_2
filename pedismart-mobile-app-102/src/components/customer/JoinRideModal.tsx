import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../shared/CustomText';
import PassengerIndicator from '../shared/PassengerIndicator';
import { getAvailableRidesForJoining, joinRide } from '@/service/rideService';
import { router } from 'expo-router';

interface JoinRideModalProps {
  visible: boolean;
  onClose: () => void;
}

const JoinRideModal: React.FC<JoinRideModalProps> = ({ visible, onClose }) => {
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchAvailableRides = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching available rides...');
      const rides = await getAvailableRidesForJoining();
      console.log(`✅ Fetched ${rides?.length || 0} rides`);
      setAvailableRides(rides || []);
    } catch (error) {
      console.error('❌ Error fetching rides:', error);
      Alert.alert('Error', 'Failed to load available rides. Please try again.');
      setAvailableRides([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAvailableRides();
    setRefreshing(false);
  };

  useEffect(() => {
    if (visible) {
      fetchAvailableRides();
    }
  }, [visible]);

  const handleJoinRide = async (rideId: string) => {
    // Prevent multiple taps
    if (joining) {
      console.log('⚠️ Already joining a ride, ignoring tap');
      return;
    }

    Alert.alert(
      'Join Ride',
      'Do you want to join this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              setJoining(true);
              console.log(`🚗 Attempting to join ride: ${rideId}`);
              const response = await joinRide(rideId);
              
              // The joinRide now sends a request to the rider for approval
              console.log('✅ Join request sent to rider, waiting for approval');
              onClose();
              
              Alert.alert(
                'Request Sent!',
                'Your join request has been sent to the rider. You will be notified when they respond.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Stay on current screen, wait for approval notification
                      console.log('⏳ Waiting for rider approval...');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('❌ Error in handleJoinRide:', error);
              Alert.alert('Error', 'Failed to send join request. Please try again.');
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
        return 'Rider on the way';
      case 'ARRIVED':
        return 'Ride in progress';
      default:
        return status;
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <CustomText fontSize={18} fontFamily="Bold" style={styles.title}>
              Join a Ride
            </CustomText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <CustomText fontSize={12} style={styles.subtitle}>
            Join an existing ride going in your direction
          </CustomText>

          {/* Ride List */}
          <ScrollView
            style={styles.rideList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {loading && availableRides.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <CustomText fontSize={12} style={styles.emptyText}>
                  Loading available rides...
                </CustomText>
              </View>
            ) : availableRides.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="car-outline" size={48} color="#ccc" />
                <CustomText fontSize={12} style={styles.emptyText}>
                  No rides available to join right now
                </CustomText>
                <CustomText fontSize={10} style={styles.emptySubtext}>
                  Pull down to refresh
                </CustomText>
              </View>
            ) : (
              availableRides.map((ride) => (
                <View key={ride._id} style={styles.rideCard}>
                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(ride.status) },
                    ]}
                  >
                    <CustomText fontSize={9} style={styles.statusText}>
                      {getStatusText(ride.status)}
                    </CustomText>
                  </View>

                  {/* Ride Info */}
                  <View style={styles.rideInfo}>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={16} color="#4CAF50" />
                      <CustomText
                        fontSize={11}
                        fontFamily="Medium"
                        numberOfLines={1}
                        style={styles.locationText}
                      >
                        {ride.pickup?.address}
                      </CustomText>
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="flag" size={16} color="#f44336" />
                      <CustomText
                        fontSize={11}
                        fontFamily="Medium"
                        numberOfLines={1}
                        style={styles.locationText}
                      >
                        {ride.drop?.address}
                      </CustomText>
                    </View>

                    {/* Distance */}
                    <View style={styles.detailRow}>
                      <Ionicons name="navigate" size={14} color="#666" />
                      <CustomText fontSize={10} style={styles.detailText}>
                        {ride.distance?.toFixed(1)} km
                      </CustomText>
                    </View>

                    {/* Rider Info (if assigned) */}
                    {ride.rider && (
                      <View style={styles.riderInfo}>
                        <Ionicons name="person-circle" size={16} color="#2196F3" />
                        <CustomText fontSize={10} style={styles.riderText}>
                          Rider: {ride.rider.firstName} {ride.rider.lastName}
                        </CustomText>
                      </View>
                    )}
                  </View>

                  {/* Passenger Indicator */}
                  <View style={styles.passengerSection}>
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
                      (ride.currentPassengerCount >= ride.maxPassengers || joining) && styles.joinButtonDisabled,
                    ]}
                    onPress={() => handleJoinRide(ride._id)}
                    disabled={ride.currentPassengerCount >= ride.maxPassengers || joining}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <CustomText fontSize={12} fontFamily="SemiBold" style={styles.joinButtonText}>
                      {joining ? 'Joining...' : ride.currentPassengerCount >= ride.maxPassengers ? 'Full' : 'Join'}
                    </CustomText>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    color: '#666',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  rideList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  rideCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rideInfo: {
    marginBottom: 12,
    paddingRight: 80,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  locationText: {
    color: '#333',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  detailText: {
    color: '#666',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  riderText: {
    color: '#2196F3',
  },
  passengerSection: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  joinButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  joinButtonText: {
    color: '#fff',
  },
});

export default JoinRideModal;
