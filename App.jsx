import React from 'react';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import { Store } from './src/store/store';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Routes } from './src/routes/Routes';
import { CartProvider } from './src/Context/CartContext';

const App = () => {
  return (
    <Provider store={Store}>
      <CartProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
      </SafeAreaView>
      <Toast />
      </CartProvider>
    </Provider>
  );
};

export default App;
