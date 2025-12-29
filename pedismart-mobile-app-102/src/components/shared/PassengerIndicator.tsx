import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from './CustomText';

interface PassengerIndicatorProps {
  currentCount: number;
  maxCount: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const PassengerIndicator: React.FC<PassengerIndicatorProps> = ({
  currentCount,
  maxCount,
  size = 'medium',
  showLabel = true,
}) => {
  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;

  // Create array of passenger icons
  const passengerIcons = [];
  for (let i = 0; i < maxCount; i++) {
    const isOccupied = i < currentCount;
    passengerIcons.push(
      <View key={i} style={styles.iconWrapper}>
        <Ionicons
          name={isOccupied ? 'person' : 'person-outline'}
          size={iconSize}
          color={isOccupied ? '#FFA500' : '#ccc'}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <CustomText fontSize={fontSize} fontFamily="SemiBold" style={styles.label}>
          Passengers
        </CustomText>
      )}
      <View style={styles.iconContainer}>
        {passengerIcons}
      </View>
      <CustomText fontSize={fontSize} fontFamily="Medium" style={styles.count}>
        {currentCount}/{maxCount}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginBottom: 4,
    color: '#333',
  },
  iconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  iconWrapper: {
    padding: 2,
  },
  count: {
    color: '#666',
    marginTop: 2,
  },
});

export default PassengerIndicator;
