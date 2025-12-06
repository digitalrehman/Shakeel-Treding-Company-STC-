import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/auth/LoginScreen';
import GetStartedScreen from '../screens/GetStartedScreen';
import BottomTabs from './BottomTabs';
import ProductDetailsScreen from '../screens/ProductDetails/ProductDetailsScreen';
import UploadPicScreen from '../screens/modules/Upload/UploadPicScreen';
import CartScreen from '../screens/ProductDetails/CartScreen';
import InquiryScreen from '../screens/InquiryScreen';
import { colors } from '../utils/color';

const Stack = createNativeStackNavigator();

export const Routes = () => {
  const token = useSelector(state => state.Data.token);
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
        },
      }}
    >
      {token ? (
        <>
          <Stack.Screen name="MainTabs" component={BottomTabs} />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{
              headerShown: true,
              title: 'Product Details',
              headerStyle: {
                backgroundColor: colors.background,
              },
              headerTintColor: colors.primary,
              headerTitleStyle: {
                color: colors.text,
                fontWeight: '600',
              },
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="CartScreen"
            component={CartScreen}
            options={{
              headerShown: true,
              title: 'Shopping Cart',
              headerStyle: {
                backgroundColor: colors.background,
              },
              headerTintColor: colors.primary,
              headerTitleStyle: {
                color: colors.text,
                fontWeight: '600',
              },
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen name="UploadPicScreen" component={UploadPicScreen} />
          <Stack.Screen name="InquiryScreen" component={InquiryScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="GetStarted" component={GetStartedScreen} />
          <Stack.Screen name="login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
