import { StyleSheet } from "react-native";

export const locationStyles = StyleSheet.create({
    container: {
        paddingVertical: 15,
        paddingRight: 15,
        marginLeft: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    confirmButtonContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: 'orange',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        width: '100%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        marginRight: 10,
    }
});