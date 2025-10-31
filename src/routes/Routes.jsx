import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/auth/LoginScreen';
import GetStartedScreen from '../screens/GetStartedScreen';
import BottomTabs from './BottomTabs';
import ProductDetailsScreen from '../screens/ProductDetails/ProductDetailsScreen';
import UploadPicScreen from '../screens/modules/Upload/UploadPicScreen';
const Stack = createNativeStackNavigator();

export const Routes = () => {
  const token = useSelector(state => state.Data.token);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="MainTabs" component={BottomTabs} />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
          />
          <Stack.Screen
            name="UploadPicScreen"
            component={UploadPicScreen}
          />
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
