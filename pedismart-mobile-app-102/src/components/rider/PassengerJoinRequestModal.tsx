import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../shared/CustomText';
import { useReverseGeocoding } from '@/hooks/useReverseGeocoding';

interface PassengerJoinRequestModalProps {
  visible: boolean;
  passengerDetails: any;
  rideDetails: any;
  onApprove: () => void;
  onDecline: () => void;
}

const PassengerJoinRequestModal: React.FC<PassengerJoinRequestModalProps> = ({
  visible,
  passengerDetails,
  rideDetails,
  onApprove,
  onDecline,
}) => {
  if (!passengerDetails) return null;

  const { address: pickupAddress } = useReverseGeocoding(
    rideDetails?.joinerPickup?.latitude || rideDetails?.pickup?.latitude,
    rideDetails?.joinerPickup?.longitude || rideDetails?.pickup?.longitude,
    rideDetails?.joinerPickup?.address || rideDetails?.pickup?.address
  );

  const { address: dropAddress } = useReverseGeocoding(
    rideDetails?.joinerDrop?.latitude || rideDetails?.drop?.latitude,
    rideDetails?.joinerDrop?.longitude || rideDetails?.drop?.longitude,
    rideDetails?.joinerDrop?.address || rideDetails?.drop?.address
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDecline}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="person-add" size={32} color="#2196F3" />
            <CustomText fontSize={18} fontFamily="Bold" style={styles.title}>
              New Passenger Request
            </CustomText>
          </View>

          {/* Passenger Photo */}
          <View style={styles.photoContainer}>
            {passengerDetails.photo ? (
              <Image
                source={{ uri: passengerDetails.photo }}
                style={styles.photo}
              />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Ionicons name="person" size={60} color="#ccc" />
              </View>
            )}
          </View>

          {/* Passenger Details */}
          <View style={styles.detailsContainer}>
            <CustomText fontSize={20} fontFamily="Bold" style={styles.name}>
              {passengerDetails.firstName} {passengerDetails.lastName}
            </CustomText>

            <View style={styles.infoRow}>
              <Ionicons name="call" size={18} color="#666" />
              <CustomText fontSize={14} style={styles.infoText}>
                {passengerDetails.phone}
              </CustomText>
            </View>

            {passengerDetails.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={18} color="#666" />
                <CustomText fontSize={14} style={styles.infoText}>
                  {passengerDetails.email}
                </CustomText>
              </View>
            )}
          </View>

          {/* Ride Info Section (Skipping some content for brevity in replace) */}
          <View style={styles.rideInfoContainer}>
            <CustomText fontSize={12} fontFamily="SemiBold" style={styles.sectionTitle}>
              Requested Route
            </CustomText>

            <View style={styles.routeRow}>
              <Ionicons name="location" size={16} color="#4CAF50" />
              <View style={{ flex: 1 }}>
                <CustomText fontSize={10} fontFamily="Bold" style={{ color: '#4CAF50' }}>PICKUP</CustomText>
                <CustomText fontSize={11} numberOfLines={2} style={styles.routeText}>
                  {pickupAddress}
                </CustomText>
              </View>
            </View>

            <View style={styles.routeRow}>
              <Ionicons name="flag" size={16} color="#f44336" />
              <View style={{ flex: 1 }}>
                <CustomText fontSize={10} fontFamily="Bold" style={{ color: '#f44336' }}>DROP-OFF</CustomText>
                <CustomText fontSize={11} numberOfLines={2} style={styles.routeText}>
                  {dropAddress}
                </CustomText>
              </View>
            </View>

            <View style={styles.passengerCount}>
              <Ionicons name="people" size={16} color="#666" />
              <CustomText fontSize={12} style={styles.countText}>
                Current Load: {rideDetails?.currentPassengerCount || 1}/{rideDetails?.maxPassengers || 6}
              </CustomText>
            </View>
          </View>

          {/* Warning Message */}
          <View style={styles.warningContainer}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <CustomText fontSize={11} style={styles.warningText}>
              This passenger wants to join your ride. Review their details before accepting.
            </CustomText>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={onDecline}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <CustomText fontSize={14} fontFamily="SemiBold" style={styles.buttonText}>
                Decline
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={onApprove}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <CustomText fontSize={14} fontFamily="SemiBold" style={styles.buttonText}>
                Accept
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  photoPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  name: {
    color: '#333',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  infoText: {
    color: '#666',
  },
  rideInfoContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#333',
    marginBottom: 10,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  routeText: {
    color: '#666',
    flex: 1,
  },
  passengerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  countText: {
    color: '#666',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    color: '#E65100',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
  },
});

export default PassengerJoinRequestModal;
