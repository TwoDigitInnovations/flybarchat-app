import {PayloadAction, createSlice} from '@reduxjs/toolkit';
import {checkConnection,getConnection} from './connectionAction';


const initialState = {
  isLoading: false,
  user: null,
  loginuser: null,
  error: null,
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
  },
  extraReducers: builder => {
    //checkConnection reducer
    builder.addCase(checkConnection.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(checkConnection.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(checkConnection.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    //getConnection reducer
    builder.addCase(getConnection.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getConnection.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(getConnection.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
  },
});
export default connectionSlice.reducer;
