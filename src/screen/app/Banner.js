import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { getBannerOffer } from '../../../redux/Menu/menuAction';
import { Back2Icon, ButtonIcon, Camera2Icon, MenuButtonIcon, MocktailIcon } from '../../Assets/theme';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { goBack, navigate } from '../../../utils/navigationRef';
import { useTranslation } from 'react-i18next';

const OfferCard = ({ offer, index }) => {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for price badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.card, { backgroundColor: offer.bg }]}>
      <Image source={{uri:offer?.image}} style={styles.cardimg} resizeMode='stretch'/>
      </View>
    </Animated.View>
  );
};

export default function Banner() {
  const { t } = useTranslation();
  const headerAnim = useRef(new Animated.Value(-30)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, tension: 100, friction: 6, delay: 300, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: 6, duration: 700, useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const dispatch = useDispatch();
  const [bannerList,setBannerList]=useState([])
  useEffect(()=>{
     getBannerList()
  },[])
  const getBannerList = () => {
      dispatch(getBannerOffer()).unwrap()
        .then(res => {
          console.log('data', res);
          setBannerList(res?.data)
        })
        .catch(error => {
          console.error('GetBanner Error:', error);
        });
    }
  return (
    <View style={styles.safeArea}>

        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerFade, transform: [{ translateY: headerAnim }] },
          ]}
        >
          <View style={styles.topcov}>
            <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => goBack()}>
                        <Back2Icon height={24} width={24} />
                      </TouchableOpacity>
            <View style={styles.toptxt}>
          <Text style={styles.appName}>{t("FLAY CHAT BAR")}</Text>
                <MocktailIcon height={28} width={28} />
            </View>
            </View>
          <Text style={styles.headerSub}>{t("To access video calls, you must buy the menu!")}</Text>

          {/* Menu Badge */}
          {/* <TouchableOpacity onPress={()=>navigate('Menu')}>
          <Animated.View style={[styles.menuBadge, { transform: [{ scale: badgeScale }] }]}>
            <Text style={styles.menuBadgeText}>{t("MENU")} <Camera2Icon height={20} width={20} style={{ marginTop: 5 }}/> {Currency}2</Text>
          </Animated.View>
          </TouchableOpacity> */}
          <MenuButtonIcon height={45} width={190} onPress={()=>navigate('Menu')}/>

          {/* Holiday Banner */}
          <View style={styles.holidayBanner}>
            <Animated.Text style={[styles.arrow, { transform: [{ translateX: arrowAnim }] }]}>→</Animated.Text>
            <Text style={styles.holidayText}>{t("Special Holiday Discounts!")}</Text>
            <Animated.Text style={[styles.arrow, { transform: [{ translateX: Animated.multiply(arrowAnim, -1) }] }]}>←</Animated.Text>
          </View>
        </Animated.View>

        {/* Offer Cards */}
        {/* <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {offers.map((offer, index) => (
            <OfferCard key={offer.id} offer={offer} index={index} />
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView> */}

        <FlatList
        data={bannerList}
        showsVerticalScrollIndicator={false}
        style={styles.scrollContent}
        renderItem={({item, index})=><OfferCard key={item._id} offer={item} index={index} />}
        />

        {/* Maybe Later */}
        <TouchableOpacity style={styles.maybeLaterBtn} >
          <Text style={styles.maybeLaterText}>{t("Maybe later")}</Text>
        </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Constants.light_black,
  },
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },

  // Header
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontFamily:FONTS.Bold,
    color: Constants.black,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 12,
    color: Constants.black,
    fontFamily:FONTS.Medium,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  menuBadge: {
    backgroundColor: Constants.custom_red,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf:"center"
  },
  menuBadgeText: {
    color: Constants.white,
    fontFamily:FONTS.Bold,
    fontSize: 16,
    letterSpacing: 1.5,
    alignItems:'center'
  },
  holidayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  holidayText: {
    color: Constants.black,
    fontFamily:FONTS.SemiBold,
    fontSize: 14,
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
  arrow: {
    color: Constants.black,
    fontSize: 16,
    fontFamily:FONTS.SemiBold,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bottomSpacer: { height: 16 },

  // Card
  cardWrapper: {
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
  },

  // Maybe Later
  maybeLaterBtn: {
    backgroundColor: Constants.custom_red,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Constants.custom_red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  maybeLaterText: {
    color: Constants.white,
    fontFamily:FONTS.SemiBold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  cardimg:{
    height:170,
    // position: 'relative',
  },
  toptxt:{
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    marginTop:15
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.07)',
    position: 'relative',
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
  topcov:{
    flexDirection:'row',
    gap:'18%',
    alignSelf:"flex-start",
    alignItems:'center'
  }
});