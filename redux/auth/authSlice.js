import {PayloadAction, createSlice} from '@reduxjs/toolkit';
import {
  checkLogin,
  login,
  resetPassword,
  sendOtp,
  signup,
  verifyOtp,
  updateProfile,
  getProfile,
  getOnlineUsers,
  getCarouselData,
  deductMenuBalence,
  logout
} from './authAction';


const initialState = {
  isLoading: false,
  user: null,
  loginuser: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCallUserDetail: (state, action) => {
      state.callUserDetail = action.payload;
    },
  },
  extraReducers: builder => {
    //login reducer
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.user = action.payload?.user;
      state.loginuser = action.payload?.user;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    //signup reducer
    builder.addCase(signup.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(signup.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(signup.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // //verify user email/phone reducer
    builder.addCase(verifyOtp.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(verifyOtp.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // //send Otp reducer
    builder.addCase(sendOtp.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(sendOtp.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(sendOtp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    //checkLogin reducer
    builder.addCase(checkLogin.fulfilled, (state, action) => {
      state.user = action.payload;
      state.loginuser = action.payload;
      state.error = null;
    });

    // //setNewPassword reducer
    builder.addCase(resetPassword.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(resetPassword.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(resetPassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // //getOnlineUsers reducer
    builder.addCase(getOnlineUsers.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getOnlineUsers.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(getOnlineUsers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // //getCarouselData reducer
    builder.addCase(getCarouselData.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCarouselData.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(getCarouselData.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    //getProfile reducer
    builder.addCase(getProfile.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getProfile.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(getProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    //updateProfile reducer
    builder.addCase(updateProfile.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.user = action.payload?.user;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    //deductMenuBalence reducer
    builder.addCase(deductMenuBalence.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(deductMenuBalence.fulfilled, (state, action) => {
      state.user = action.payload?.user;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(deductMenuBalence.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(logout.fulfilled, (state, action) => {
      state.user = null;
      state.loginuser = null;
      state.error = null;
    });
  },
});
export const {
  setCallUserDetail,
} = authSlice.actions;
export default authSlice.reducer;
