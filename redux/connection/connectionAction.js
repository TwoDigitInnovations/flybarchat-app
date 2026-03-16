import {createAsyncThunk} from '@reduxjs/toolkit';
import {showToaster} from '../../utils/toaster';
import axios from '../../utils/axios';

//For checkConnection
export const checkConnection = createAsyncThunk(
  'connection/checkConnection',
  async (params, thunkAPI) => {
    try {
      const {data}= await axios.post(`connection/checkConnection`,params);
      return data;
    } catch (error) {
      showToaster('error',error);
      return thunkAPI.rejectWithValue(error);
    }
  },
);

//For getConnection
export const getConnection = createAsyncThunk(
  'connection/getConnection',
  async (params, thunkAPI) => {
    try {
      let url=`connection/getConnection`
      if (params) {
       url=`connection/getConnection?search=${params}`
        
      }
      const {data}= await axios.get(url);
      return data;
    } catch (error) {
      showToaster('error',error);
      return thunkAPI.rejectWithValue(error);
    }
  },
);

