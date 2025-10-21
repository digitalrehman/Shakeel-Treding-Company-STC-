import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import Main from './Main';
import LoginScreen from '../screens/auth/LoginScreen';
import GetStartedScreen from '../screens/GetStartedScreen';
const Stack = createNativeStackNavigator();

export const Routes = () => {
  const token = useSelector(state => state.Data.token);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="Main" component={Main} />
      ) : (
        <>
          <Stack.Screen name="GetStarted" component={GetStartedScreen} />
          <Stack.Screen name="login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

