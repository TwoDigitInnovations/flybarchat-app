import React, { memo, useEffect, useState} from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Constants, { FONTS } from '../Helpers/constant';
import { hp, wp } from '../../../utils/responsiveScreen';
// import { WifiX } from '../../../Theme';
import {WifiOff} from 'lucide-react-native'
const NetError = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
      console.log('state', state);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Modal
      visible={!isConnected}
      transparent
      animationType="fade"
      style={styles.modalView}>
      <View style={styles.container}>
        {/* <WifiX height={wp(22)} width={wp(22)} /> */}
        <WifiOff size={wp(22)} color={Constants.white} />
        <Text style={styles.title}>Connection Error</Text>

        <Text style={styles.title2}>
          Please check your network connectivity and try again.
        </Text>
      </View>
    </Modal>
  );
};

export default memo(NetError);

const styles = StyleSheet.create({
  modalView: {flex: 1},
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Constants.light_yellow,
    paddingHorizontal: wp(15),
  },
  title: {
    fontSize: wp(4),
    fontFamily: FONTS.Heavy,
    color: Constants.white,
    textAlign: 'center',
    marginTop:hp(1.5),
    marginBottom:hp(0.5)
  },
  title2: {
    fontSize: wp(3.8),
    fontFamily: FONTS.SemiBold,
    color: Constants.white,
    textAlign: 'center',
  },
});
