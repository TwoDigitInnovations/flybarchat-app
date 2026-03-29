import {
  useSelector as useAppSelector,
  useDispatch as useAppDispatch,
} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import authSlice from './auth/authSlice';
import connectionSlice from './connection/conectionSlice';
import menuSlice from './Menu/menuSlice';
import musicSlice from './Music/musicSlice';
import languageSlice from './language/languageSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    connection: connectionSlice,
    menu: menuSlice,
    music: musicSlice,
    language: languageSlice,
  },
});

export const useDispatch = () => useAppDispatch();
export const useSelector = useAppSelector;
