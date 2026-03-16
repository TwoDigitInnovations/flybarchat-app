import {createAsyncThunk} from '@reduxjs/toolkit';
import {showToaster} from '../../utils/toaster';
import axios from '../../utils/axios';

//For getAllMenu
export const getAllMenu = createAsyncThunk(
  'menu/getAllMenu',
  async (params, thunkAPI) => {
    try {
      const {data}= await axios.get(`menu/getAllMenu`,params);
      return data;
    } catch (error) {
      showToaster('error',error);
      return thunkAPI.rejectWithValue(error);
    }
  },
);

//For getBannerOffer
export const getBannerOffer = createAsyncThunk(
  'banner/getBannerOffer',
  async (_, thunkAPI) => {
    try {
      const {data}= await axios.get(`banner/get-banner-offer`);
      return data;
    } catch (error) {
      showToaster('error',error);
      return thunkAPI.rejectWithValue(error);
    }
  },
);

