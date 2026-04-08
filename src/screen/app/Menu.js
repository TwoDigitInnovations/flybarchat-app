import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getAllMenu } from '../../../redux/Menu/menuAction';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { useTranslation } from 'react-i18next';
import { SOCKET_URL } from '../../../utils/config';
import { deductMenuBalence } from '../../../redux/auth/authAction';
import { goBack, navigate } from '../../../utils/navigationRef';
import Toast from 'react-native-toast-message';
import { ArrowRight2Icon, Back2Icon, BackIcon } from '../../Assets/theme';

const MenuItem = ({ item, index, onPress }) => {
  const { t } = useTranslation();
  const isRight = (index + 1) % 2 === 0;

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.85}>
      <Image source={{ uri: item?.image }} style={[styles.itemImage,{ transform: [{ rotate: isRight ? '3deg' : '-3deg' }] }]} />
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item?.name}</Text>
        <Text style={styles.itemSubtitle}>{item?.time} {t('min video call')}</Text>
        <Text style={styles.itemPrice}>{Currency}{item?.price}</Text>
      </View>
      <View style={styles.arrowWrap}>
        <ArrowRight2Icon color={Constants.black} />
      </View>
    </TouchableOpacity>
  );
};

export default function DrinkMenuScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const callUserDetail = useSelector(state => state.auth.callUserDetail);
  const [menuList, setMenuList] = useState([]);

  useEffect(() => {
    getMenuList();
  }, []);

  const getMenuList = () => {
    dispatch(getAllMenu())
      .unwrap()
      .then(res => {
        setMenuList(res);
      })
      .catch(error => {
        console.error('GetMenu Error:', error);
      });
  };

  const purchesMenu = item => {
    if (Number(item) > Number(user?.wallet || 0)) {
      Toast.show({
        type: 'error',
        text1: t('Insufficient Balance'),
        text2: t('Please recharge your wallet to continue.'),
      });
      return;
    }
    dispatch(deductMenuBalence({ menu_price: Number(item) }))
      .unwrap()
      .then(res => {
        handleVideoCall();
      })
      .catch(error => {
        console.error('deductMenuBalence Error:', error);
      });
  };

  const generateRoomId = (id1, id2) => [id1, id2].sort().join('__');

  const handleVideoCall = async () => {
    const roomId = generateRoomId(user?._id, callUserDetail?.calleeId);
    try {
      await fetch(`${SOCKET_URL}/notify-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerId: user?._id,
          callerName: user?.name,
          calleeId: callUserDetail?.calleeId,
          roomId,
        }),
      });
    } catch (err) {
      console.log('[ChatDetail] notify-call error:', err.message);
    }
    navigate('VideoCall', {
      roomId,
      calleeId: callUserDetail?.calleeId,
      calleeName: callUserDetail?.calleeName,
      callerName: user?.name,
      isInitiator: true,
    });
  };

  return (
    <View style={styles.safeArea}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
                               style={styles.backButton}
                               onPress={() => goBack()}>
                               <Back2Icon height={24} width={24} />
                             </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t('Drink Menu')}</Text>
          <Text style={styles.headerSubtitle}>{t('Send a drink to Unlock video call')}</Text>
        </View>
        
        <View style={styles.walletcov} >
          <Text style={styles.walletText}>{Currency} {Number(user?.wallet || 0).toFixed(2)}</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={menuList}
        contentContainerStyle={styles.listContent}
        renderItem={({ item,index }) => (
          <MenuItem item={item} index={index} onPress={() => purchesMenu(item?.price)} />
        )}
        keyExtractor={item => item._id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t('No Menu Available')}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom CTA */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => goBack()}>
          <Text style={styles.ctaText}>{t('May be later')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Constants.light_black,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Constants.light_black,
  },
  backButton: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: Constants.light_pink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    boxShadow: '0px 2px 4px 0.5px gray',
  },
  backArrow: {
    fontSize: 30,
    color: '#333',
    lineHeight: 34,
    marginTop: -4,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Inter_SemiBold,
  },
  headerSubtitle: {
    color: Constants.black,
    fontFamily: FONTS.Inter_Regular,
    fontSize: 12,
    marginTop: 2,
  },

  // List
  listContent: {
  paddingHorizontal: 20,  // slightly more horizontal padding
  paddingTop: 16,
  paddingBottom: 16,
  gap: 16,                // if using React Native 0.71+, or use separator
},

  // Card
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F1F7',
    borderRadius: 16,
    padding: 14,
    boxShadow: '0px 2px 4px 0.5px gray',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f0e6ee',
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
  },
  itemName: {
    color: '#1A1A1A',
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    marginBottom: 4,
  },
  itemSubtitle: {
    color: Constants.customgrey,
    fontSize: 12,
    fontFamily: FONTS.Inter_Regular,
    marginBottom: 6,
  },
  itemPrice: {
    color: Constants.black,
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  arrowWrap: {
    paddingLeft: 8,
  },
  arrowText: {
    fontSize: 26,
    color: Constants.custom_red,
    lineHeight: 30,
  },

  separator: {
    height: 12,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: Dimensions.get('window').height - 200,
  },
  emptyText: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS.Medium,
  },

  // Bottom CTA
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Constants.light_black,
  },
  ctaButton: {
    backgroundColor: Constants.custom_red,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Constants.custom_red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    letterSpacing: 0.3,
  },
  walletText:{
    color: Constants.white,
    fontSize: 14,
    fontFamily:FONTS.Medium,
  },
  walletcov:{
    backgroundColor: Constants.custom_red,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});