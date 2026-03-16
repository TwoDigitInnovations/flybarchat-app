import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN = '@token';

// -----------Auth Token------
export const getAuthToken = async ()=> {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN);
    return token != null ? JSON.parse(token) : null;
  } catch (e) {
    return null;
  }
};

export const setAuthToken = async (value) => {
  try {
    const token = JSON.stringify(value);
    await AsyncStorage.setItem(AUTH_TOKEN, token);
    return true;
  } catch (e) {
    return false;
  }
};

export const deleteAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN);
    return true;
  } catch (e) {
    return false;
  }
};
