import {PayloadAction, createSlice} from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  langCode: 'en',
  error: null,
};

const locationSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.langCode = action.payload;
    },
  },
  extraReducers: builder => {
    
  },
});
export const {
  setLanguage,
} = locationSlice.actions;
export default locationSlice.reducer;
