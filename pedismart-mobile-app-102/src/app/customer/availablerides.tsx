import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '@/components/shared/CustomText';
import AvailableRideCard from '@/components/customer/AvailableRideCard';
import { getAvailableRidesForJoining } from '@/service/rideService';
import { useWS } from '@/service/WSProvider';
import { StatusBar } from 'expo-status-bar';

const AvailableRides = () => {
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams() as any;
  const { on, off } = useWS();

  const fetchRides = async () => {
    try {
      console.log('🔍 Fetching available rides...');
      const rides = await getAvailableRidesForJoining();
      console.log(`✅ Found ${rides?.length || 0} available rides`);
      setAvailableRides(rides || []);
    } catch (error) {
      console.error('❌ Error fetching available rides:', error);
      Alert.alert('Error', 'Failed to load available rides');
      setAvailableRides([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  useEffect(() => {
    fetchRides();

    // Listen for real-time updates
    on("passengerUpdate", () => {
      console.log('👥 Passenger update - refreshing rides');
      fetchRides();
    });

    on("newRideRequest", () => {
      console.log('🚗 New ride - refreshing rides');
      fetchRides();
    });

    on("rideAccepted", () => {
      console.log('✅ Ride accepted - refreshing rides');
      fetchRides();
    });

    // Listen for join request approval
    on("joinRequestApproved", (data: any) => {
      console.log('🎉 Available Rides: Join request approved!', data);
      Alert.alert(
        "Request Approved!",
        "The rider has approved your join request. You can now join the ride!",
        [
          {
            text: "Join Ride",
            onPress: () => {
              router.push({
                pathname: '/customer/liveride',
                params: { id: data.rideId },
              });
            }
          }
        ]
      );
    });

    // Listen for join request decline
    on("joinRequestDeclined", (data: any) => {
      console.log('❌ Available Rides: Join request declined', data);
      Alert.alert(
        "Request Declined",
        data.message || "The rider has declined your join request.",
        [{ text: "OK" }]
      );
      fetchRides(); // Refresh the list
    });

    return () => {
      off("passengerUpdate");
      off("newRideRequest");
      off("rideAccepted");
      off("joinRequestApproved");
      off("joinRequestDeclined");
    };
  }, [on, off]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#2196F3" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <CustomText fontSize={18} fontFamily="Bold" style={styles.headerTitle}>
          Available Rides
        </CustomText>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Ionicons name="hourglass-outline" size={48} color="#ccc" />
            <CustomText fontSize={14} style={styles.emptyText}>
              Loading available rides...
            </CustomText>
          </View>
        ) : availableRides.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="car-outline" size={64} color="#ccc" />
            <CustomText fontSize={16} fontFamily="SemiBold" style={styles.emptyTitle}>
              No Available Rides
            </CustomText>
            <CustomText fontSize={12} style={styles.emptyText}>
              There are no rides accepting passengers right now.
            </CustomText>
            <CustomText fontSize={12} style={styles.emptyText}>
              Pull down to refresh or check back later.
            </CustomText>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <CustomText fontSize={11} style={styles.infoText}>
                {availableRides.length} ride{availableRides.length !== 1 ? 's' : ''} available.
                Tap "Request to Join" to send a request to the rider.
              </CustomText>
            </View>

            {availableRides.map((ride, index) => (
              <AvailableRideCard
                key={ride._id}
                ride={ride}
                onJoinSuccess={() => {
                  fetchRides();
                }}
                joinerPickup={params?.pickup_address ? {
                  address: params.pickup_address,
                  latitude: parseFloat(params.pickup_latitude),
                  longitude: parseFloat(params.pickup_longitude),
                } : undefined}
                joinerDrop={params?.drop_address ? {
                  address: params.drop_address,
                  latitude: parseFloat(params.drop_latitude),
                  longitude: parseFloat(params.drop_longitude),
                } : undefined}
              />
            ))}

            <View style={styles.bottomPadding} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    color: '#1976D2',
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
});

export default AvailableRides;
