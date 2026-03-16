import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import GetCurrentAddressByLatLong from './GetCurrentAddressByLatLong';
import { setAddress, setLocation } from '../../../redux/location/locationSlice';

const RequestCurrentLocation = async (dispatch, user) => {
  try {
    if (Platform.OS === 'ios') {
      const permission = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

      if (permission === RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          position => {
            console.log(position);
            dispatch(setLocation({
                lat: position.coords.latitude,
                long: position.coords.longitude,
              }));
            if (user?.type === 'user') {
              GetCurrentAddressByLatLong({
                lat: position.coords.latitude,
                long: position.coords.longitude,
              }).then(res => {
                console.log('res===>', res);
                dispatch(setAddress(res?.results[0]?.formatted_address));
              });
            }
          },
          error => {
            console.log(error.code, error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      } else if (permission === RESULTS.DENIED) {
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (result === RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            position => {
              console.log(position);
              dispatch(setLocation({
                lat: position.coords.latitude,
                long: position.coords.longitude,
              }));
            if (user?.type === 'user') {
              GetCurrentAddressByLatLong({
                lat: position.coords.latitude,
                long: position.coords.longitude,
              }).then(res => {
                console.log('res===>', res);
                dispatch(setAddress(res?.results[0]?.formatted_address));
              });
            }
            },
            error => {
              console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        }
      } else if (permission === RESULTS.BLOCKED) {
        Alert.alert(
          'Location Permission Required',
          'Location access is blocked. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openURL('app-settings:'),
            },
          ],
        );
      }
    } else {
      // console.log('android',user);
      const permission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (permission) {
        Geolocation.getCurrentPosition(
          position => {
            console.log(position);
            dispatch(setLocation({
                lat: position.coords.latitude,
                long: position.coords.longitude,
              }));
            if (user?.type === 'user') {
              GetCurrentAddressByLatLong({
                lat: position.coords.latitude,
                long: position.coords.longitude,
              }).then(res => {
                console.log('res===>', res);
                dispatch(setAddress(res?.results[0]?.formatted_address));
              });
            }
          },
          error => {
            console.log(error.code, error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            position => {
              dispatch(setLocation({
                lat: position.coords.latitude,
                long: position.coords.longitude,
              }),);
              if (user?.type === 'user') {
                GetCurrentAddressByLatLong({
                  lat: position.coords.latitude,
                  long: position.coords.longitude,
                }).then(res => {
                  console.log('res===>', res);
                  dispatch(setAddress(res?.results[0]?.formatted_address));
                });
              }
            },
            error => {
              console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Location Permission Required',
            'Location access is blocked. Please enable it in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          console.log('Location permission denied');
        }
      }
    }
  } catch (err) {
    console.log('Location error:', err);
  }
};

export default RequestCurrentLocation;
