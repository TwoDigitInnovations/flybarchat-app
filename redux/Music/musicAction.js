import {createAsyncThunk} from '@reduxjs/toolkit';
import {showToaster} from '../../utils/toaster';
import axios from '../../utils/axios';

//For getAllMusic
export const getAllMusic = createAsyncThunk(
  'music/getAllMusic',
  async (params, thunkAPI) => {
    try {
      const {data}= await axios.get(`music/getAllMusic?page=${params}`);
      return data;
    } catch (error) {
      showToaster('error',error);
      return thunkAPI.rejectWithValue(error);
    }
  },
);

