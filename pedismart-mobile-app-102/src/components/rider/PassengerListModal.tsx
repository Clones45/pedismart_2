import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../shared/CustomText';
import { RFValue } from 'react-native-responsive-fontsize';

interface Passenger {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'WAITING' | 'ONBOARD' | 'DROPPED';
  isOriginalBooker: boolean;
  joinedAt: Date;
  boardedAt?: Date;
}

interface PassengerListModalProps {
  visible: boolean;
  onClose: () => void;
  passengers: Passenger[];
  onUpdateStatus: (passengerId: string, status: 'WAITING' | 'ONBOARD' | 'DROPPED') => void;
  onRemovePassenger: (passengerId: string) => void;
  isRider: boolean;
}

const PassengerListModal: React.FC<PassengerListModalProps> = ({
  visible,
  onClose,
  passengers,
  onUpdateStatus,
  onRemovePassenger,
  isRider,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING':
        return '#FF9800';
      case 'ONBOARD':
        return '#4CAF50';
      case 'DROPPED':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'time-outline';
      case 'ONBOARD':
        return 'checkmark-circle';
      case 'DROPPED':
        return 'flag';
      default:
        return 'help-circle';
    }
  };

  const handleStatusChange = (passenger: Passenger, newStatus: 'WAITING' | 'ONBOARD' | 'DROPPED') => {
    if (!isRider) return;
    if (passenger.status === newStatus) return; // No change needed

    // Handle both string userId and object userId._id
    const passengerId = typeof passenger.userId === 'string' 
      ? passenger.userId 
      : (passenger.userId as any)?._id;

    const statusMessages = {
      WAITING: 'Mark as waiting at pickup',
      ONBOARD: 'Mark as onboard the vehicle',
      DROPPED: 'Mark as dropped off (will redirect passenger to complete screen)'
    };

    Alert.alert(
      'Update Passenger Status',
      `${passenger.firstName} ${passenger.lastName}\n\n${statusMessages[newStatus]}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => onUpdateStatus(passengerId, newStatus),
        },
      ]
    );
  };

  const handleRemovePassenger = (passenger: Passenger) => {
    if (passenger.isOriginalBooker && passengers.length === 1) {
      Alert.alert(
        'Cannot Remove',
        'Cannot remove the original booker when they are the only passenger.'
      );
      return;
    }

    // Handle both string userId and object userId._id
    const passengerId = typeof passenger.userId === 'string' 
      ? passenger.userId 
      : (passenger.userId as any)?._id;

    Alert.alert(
      'Remove Passenger',
      `Remove ${passenger.firstName} ${passenger.lastName} from this ride?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemovePassenger(passengerId),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <CustomText fontSize={18} fontFamily="Bold" style={styles.title}>
              Passengers ({passengers.length}/6)
            </CustomText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Passenger List */}
          <ScrollView style={styles.passengerList}>
            {passengers.map((passenger, index) => {
              // Handle both string userId and object userId._id
              const passengerId = typeof passenger.userId === 'string' 
                ? passenger.userId 
                : (passenger.userId as any)?._id || `passenger-${index}`;
              
              return (
              <View key={passengerId} style={styles.passengerCard}>
                <View style={styles.passengerInfo}>
                  {/* Avatar */}
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>

                  {/* Details */}
                  <View style={styles.details}>
                    <View style={styles.nameRow}>
                      <CustomText fontSize={14} fontFamily="SemiBold">
                        {passenger.firstName} {passenger.lastName}
                      </CustomText>
                      {passenger.isOriginalBooker && (
                        <View style={styles.bookerBadge}>
                          <CustomText fontSize={9} style={styles.bookerText}>
                            BOOKER
                          </CustomText>
                        </View>
                      )}
                    </View>
                    {passenger.phone && (
                      <CustomText fontSize={11} style={styles.phone}>
                        📞 {passenger.phone}
                      </CustomText>
                    )}
                    <View style={styles.statusRow}>
                      <Ionicons
                        name={getStatusIcon(passenger.status)}
                        size={16}
                        color={getStatusColor(passenger.status)}
                      />
                      <CustomText
                        fontSize={11}
                        fontFamily="Medium"
                        style={[
                          styles.status,
                          { color: getStatusColor(passenger.status) },
                        ]}
                      >
                        {passenger.status}
                      </CustomText>
                    </View>
                  </View>
                </View>

                {/* Actions (Rider Only) */}
                {isRider && (
                  <View style={styles.actions}>
                    {/* Show ONBOARD button only if status is WAITING */}
                    {passenger.status === 'WAITING' && (
                      <TouchableOpacity
                        style={[styles.statusActionButton, styles.onboardButton]}
                        onPress={() => handleStatusChange(passenger, 'ONBOARD')}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <CustomText fontSize={9} style={styles.actionButtonText}>ONBOARD</CustomText>
                      </TouchableOpacity>
                    )}
                    
                    {/* Show DROPPED button only if status is ONBOARD */}
                    {passenger.status === 'ONBOARD' && (
                      <TouchableOpacity
                        style={[styles.statusActionButton, styles.droppedButton]}
                        onPress={() => handleStatusChange(passenger, 'DROPPED')}
                      >
                        <Ionicons name="flag" size={16} color="#fff" />
                        <CustomText fontSize={9} style={styles.actionButtonText}>DROPPED</CustomText>
                      </TouchableOpacity>
                    )}
                    
                    {/* Remove Button - always show unless already DROPPED */}
                    {passenger.status !== 'DROPPED' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.removeButton]}
                        onPress={() => handleRemovePassenger(passenger)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              );
            })}
          </ScrollView>

          {isRider && (
            <View style={styles.footer}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                  <CustomText fontSize={10} style={styles.legendText}>Waiting</CustomText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                  <CustomText fontSize={10} style={styles.legendText}>Onboard</CustomText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#9E9E9E' }]} />
                  <CustomText fontSize={10} style={styles.legendText}>Dropped</CustomText>
                </View>
              </View>
              <CustomText fontSize={9} style={styles.footerText}>
                💡 Dropping a passenger will redirect them to the complete screen
              </CustomText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  passengerList: {
    padding: 15,
  },
  passengerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookerBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  bookerText: {
    color: '#333',
    fontWeight: 'bold',
  },
  phone: {
    color: '#666',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  status: {
    textTransform: 'uppercase',
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 3,
  },
  onboardButton: {
    backgroundColor: '#4CAF50',
  },
  droppedButton: {
    backgroundColor: '#9E9E9E',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#f44336',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#666',
  },
  footerText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PassengerListModal;
