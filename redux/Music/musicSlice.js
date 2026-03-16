import { createSlice} from '@reduxjs/toolkit';
import { getAllMusic } from './musicAction';


const initialState = {
  isLoading: false,
  user: null,
  loginuser: null,
  error: null,
};

const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
  },
  extraReducers: builder => {
    //getAllMusic reducer
    builder.addCase(getAllMusic.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAllMusic.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(getAllMusic.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
  },
});
export default musicSlice.reducer;
