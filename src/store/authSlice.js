import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import CryptoJS from 'crypto-js';

export const CurrentLogin = createAsyncThunk(
  'user',
  async ({ config, username, password }) => {
    return axios(config)
      .then(data => {
        const user = data?.data?.data?.find(user => user.user_id === username);
        if (user) {
          const hashedPassword = CryptoJS.MD5(password).toString();

          if (hashedPassword === user.password) {
            return user;
          } else {
            Toast.show({
              type: 'error',
              text1: 'Invalid password',
              text2: 'Your password is incorrect',
            });
          }
        } else {
          Toast.show({
            type: 'error',
            text1: 'Invalid username',
            text2: 'Your username is invalid',
          });
        }
      })
      .catch(error => {
        console.log(error);
      });
  },
);

export const AuthSlice = createSlice({
  name: 'UsersData',
  initialState: {
    currentData: [],
    cartData: [],
    token: '',
    isLoggedIn: false,
    GrandCartTotalPrice: '0',
    Loading: false,
    AllProduct: [],
    accessData: [],
  },
  reducers: {
    setLoader: (state, action) => {
      state.Loading = action.payload;
    },
    setMyData: (state, action) => {
      state.currentData = action.payload;
    },

    setCartData: (state, action) => {
      state.cartData = action.payload;
    },
    setGrandCartTotalPrice: (state, action) => {
      state.GrandCartTotalPrice = action.payload;
    },
    setAllProducts: (state, action) => {
      state.AllProduct = action.payload;
    },
    setUserAccess: (state, action) => {
      state.accessData = action.payload;
    },

    setToken: (state, action) => {
      state.token = action.payload.data;
      state.isLoggedIn = !!action.payload.data;
    },
    setLogout: state => {
      state.token = '';
      state.currentData = [];
      state.isLoggedIn = false;
    },
  },

  extraReducers: builder => {
    builder
      .addCase(CurrentLogin.fulfilled, (state, action) => {
        state.Loading = false;
        if (action.payload) {
          state.currentData = action.payload;
          state.token = action.payload.password;
        } else {
          Toast.show({
            type: 'error',
            text1: 'Your username or password is incorrect',
          });
        }
      })
      .addCase(CurrentLogin.rejected, (state, action) => {
        state.Loading = false;
      });
  },
});

export const {
  setMyData,
  setToken,
  setLogout,
  setLoader,
  setCartData,
  setGrandCartTotalPrice,
  setAllProducts,
  setUserAccess,
} = AuthSlice.actions;

export default AuthSlice.reducer;
