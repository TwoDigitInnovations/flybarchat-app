import axios from 'axios';
import {deleteAuthToken} from './storage';
import * as navigation from './navigationRef';
import Constants from '../src/Assets/Helpers/constant';

const axiosInstance = axios.create({
  baseURL: Constants.baseUrl,
  headers: {
    'Content-Type': 'application/json',
    app_type: 'user',
  },
});

axiosInstance.interceptors.response.use(
  function (response) {
    console.log(response.config.url + ': axios-response', response);
    if (response.data?.status) {
      return response.data;
    } else {
      const message = response.data?.message;
      return Promise.reject(message);
    }
  },
  async function (error) {
    console.log((error.config.url || '') + ': axios-error', error);
    let message = '';
    if (error.response) {
      if (error.response.status === 401) {
        removeApiToken();
        await deleteAuthToken();
        navigation.reset('Auth',{screen:'SignIn'});
      }
      message = error.response.data?.message || error?.message;
    } else {
      message = error.message;
    }
    return Promise.reject(message);
  },
);

export const setApiToken = (AUTH_TOKEN) => {
  return (axiosInstance.defaults.headers.common.Authorization = `Bearer ${AUTH_TOKEN}`);
};

export const removeApiToken = () => {
  return (axiosInstance.defaults.headers.common.Authorization = '');
};

export default axiosInstance;
