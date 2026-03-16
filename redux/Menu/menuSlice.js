import { createSlice} from '@reduxjs/toolkit';
import { getAllMenu,getBannerOffer } from './menuAction';


const initialState = {
  isLoading: false,
  user: null,
  loginuser: null,
  error: null,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
  },
  extraReducers: builder => {
    //getAllMenu reducer
    builder.addCase(getAllMenu.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAllMenu.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(getAllMenu.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    //getBannerOffer reducer
    builder.addCase(getBannerOffer.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getBannerOffer.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(getBannerOffer.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
  },
});
export default menuSlice.reducer;
