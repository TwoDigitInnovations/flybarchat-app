import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import Constants, { FONTS } from '../Helpers/constant';
import { goBack } from '../../../utils/navigationRef';
// import { ChevronLeft } from 'lucide-react-native';

const Header = props => {

  return (
    <View style={styles.toppart}>
      <View style={styles.secndcov}>
          {/* {props.showback ? (
            <ChevronLeft
              color={Constants.black}
              height={25}
              width={25}
              style={{ alignSelf: 'center' }}
              onPress={() => goBack()}
            />
          ):<View style={{width:25}}></View>} */}
          <Text style={styles.backtxt}>{props?.item}</Text>
          <View></View>
        </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  backtxt: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
    marginLeft:-35
  },
  toppart: {
    flexDirection: 'row',
    justifyContent:'space-between'
    // paddingTop: 20,
    // paddingHorizontal: 20,
    // paddingBottom: 20,
    // backgroundColor: Constants.light_yellow,
    // borderBottomLeftRadius: 10,
    // borderBottomRightRadius: 10,
  },
  secndcov: {
    flexDirection: 'row',
    gap: 10,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
