import { View, Text } from "react-native";
import React from "react";
import CustomText from "../shared/CustomText";

// Simplified Web Component to avoid native module crashes
const RiderLiveTracking = ({ status }: { status: string }) => {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0" }}>
            <CustomText fontFamily="Bold" fontSize={16}>
                Map View Not Available on Web
            </CustomText>
            <CustomText fontFamily="Medium" fontSize={12} style={{ marginTop: 10, color: "#666" }}>
                Please use the mobile app to view the live tracking map.
            </CustomText>
            <View style={{ marginTop: 20, padding: 10, backgroundColor: "#fff", borderRadius: 8 }}>
                <CustomText fontSize={12}>Current Status: {status}</CustomText>
            </View>
        </View>
    );
};

export default RiderLiveTracking;
