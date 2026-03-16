import React, { useEffect, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import Constants, { FONTS } from './src/Assets/Helpers/constant';
// import { OneSignal } from 'react-native-onesignal';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { store } from './redux/store';
// import { checkLogin } from './redux/auth/authAction';
import Spinner from './src/Assets/Component/Spinner';
// import NetError from './src/Assets/Component/NetError';
// import Splash from 'react-native-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkLogin } from './redux/auth/authAction';
// import i18n from './i18n';
// import { setLanguage } from './redux/location/locationSlice';

const App = () => {
  // const APP_ID = 'df0d1c60-c14f-4226-8ba1-927c55e75f3a';

  // useEffect(() => {
  //   OneSignal.initialize(APP_ID);
  //   OneSignal.Notifications.requestPermission(true);
  // }, [OneSignal]);

  useEffect(()=>{
    // checkLng()
    store.dispatch(checkLogin()).unwrap()
      .finally(() => {
        // setTimeout(() => {
        //   Splash.hide();
        // }, 500);
      });
  },[])

  const checkLng = async () => {
      const x = await AsyncStorage.getItem('LANG');
      if (x != null) {
        i18n.changeLanguage(x);
        let lng = x == x == 'sv' ? 'Swedish':'English';
        store.dispatch(setLanguage(lng))
      }
    };

  return (
    <Provider store={store}>
      <SafeAreaView
        edges={
          Platform.OS === 'ios'
            ? ['left', 'top', 'right']
            : ['bottom', 'left', 'right', 'top']
        }
        style={styles.container}
      >
        <StatusBar barStyle="light-content" backgroundColor={Constants.light_black} />
        {/* <NetError /> */}
        <Spinner />
        <Navigation />
        <Toast />
      </SafeAreaView>
     </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.light_black,
  },
});

export default App;
