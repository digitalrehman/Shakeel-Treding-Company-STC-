import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Dashboard from '../screens/Dashboard';
import Settings from '../screens/Settings';
import ScannerScreen from '../screens/ScannerScreen';
import { colors } from '../utils/color';

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.customButton}>{children}</View>
  </TouchableOpacity>
);

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* DASHBOARD */}
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              color={focused ? colors.primary : colors.textSecondary}
              size={26}
              style={styles.icon}
            />
          ),
        }}
      />

      {/* SCANNER */}
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="scan-outline"
              color="#fff"
              size={30}
              style={{ alignSelf: 'center' }}
            />
          ),
          tabBarButton: props => <CustomTabBarButton {...props} />,
        }}
      />

      {/* SETTINGS */}
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              color={focused ? colors.primary : colors.textSecondary}
              size={26}
              style={styles.icon}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 0,
    position: 'absolute',
    bottom: 0, // ✅ Stick to bottom
    left: 0,
    right: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: 70,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    alignSelf: 'center',
    top: Platform.OS === 'android' ? 20 : 0, // vertically center tweak
  },
  customButtonContainer: {
    top: -30, // floating center button
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default BottomTabs;
