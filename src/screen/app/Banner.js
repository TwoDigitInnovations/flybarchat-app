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
import { Back2Icon, MocktailIcon } from '../../Assets/theme';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { goBack, navigate } from '../../../utils/navigationRef';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const offers = [
  {
    id: 'christmas',
    title: 'Christmas Offer!',
    titleColor: '#FF4444',
    subtitle: 'Limited Time ONLY',
    originalPrice: '$2',
    discountPrice: '$1.50',
    label: 'Only Today',
    gradient: ['#1a472a', '#2d6a4f'],
    accentColor: '#FF4444',
    emoji: '🎄',
    decorEmoji: '🎅',
    bg: '#1a2f1a',
  },
  {
    id: 'easter',
    title: 'Easter Offer!',
    titleColor: '#FFD700',
    subtitle: 'Limited Time ONLY',
    originalPrice: '$2',
    discountPrice: '$1.50',
    label: 'Only Today',
    gradient: ['#2d4a1e', '#3d6b2a'],
    accentColor: '#FFD700',
    emoji: '🐣',
    decorEmoji: '🕊️',
    bg: '#1e2d1e',
  },
  {
    id: 'august',
    title: 'August 15 Offer!',
    titleColor: '#FF6B35',
    subtitle: 'Limited Time ONLY',
    originalPrice: '$2',
    discountPrice: '$1.50',
    label: 'Only Today',
    gradient: ['#2a1f0e', '#4a3520'],
    accentColor: '#FF6B35',
    emoji: '🏖️',
    decorEmoji: '🍹',
    bg: '#2a1f0e',
  },
];

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
      {/* <View style={[styles.card, { backgroundColor: offer.bg }]}>
        <View style={[styles.blob, styles.blobLeft, { backgroundColor: offer.accentColor + '22' }]} />
        <View style={[styles.blob, styles.blobRight, { backgroundColor: offer.accentColor + '15' }]} />

        <Text style={styles.decorEmoji}>{offer.decorEmoji}</Text>

        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.bigEmoji}>{offer.emoji}</Text>
          </View>

          <View style={styles.cardRight}>
            <View style={styles.titleRow}>
              <Text style={[styles.offerTitle, { color: offer.titleColor }]}>
                {offer.title}
              </Text>
            </View>

            <Text style={styles.subtitle}>{offer.subtitle}</Text>

            <Animated.View style={[styles.priceBadge, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.discountPrice}>{offer.discountPrice}</Text>
              <Text style={styles.priceLabel}>{offer.label}</Text>
              <Text style={styles.originalPrice}>{offer.originalPrice}</Text>
            </Animated.View>

            <TouchableOpacity
              style={[styles.buyButton, { borderColor: offer.accentColor }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.buyButtonText, { color: offer.accentColor }]}>
                Buy Menu!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View> */}
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
      <View style={styles.container}>

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
          <TouchableOpacity onPress={()=>navigate('Menu')}>
          <Animated.View style={[styles.menuBadge, { transform: [{ scale: badgeScale }] }]}>
            <Text style={styles.menuBadgeText}>{t("MENU")}  🎥  {Currency}2</Text>
          </Animated.View>
          </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d0d0d',
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
    color: Constants.white,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 12,
    color: Constants.customgrey3,
    fontFamily:FONTS.Regular,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  menuBadge: {
    backgroundColor: '#FECD2B',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  menuBadgeText: {
    color: Constants.black,
    fontFamily:FONTS.Bold,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  holidayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  holidayText: {
    color: Constants.white,
    fontFamily:FONTS.SemiBold,
    fontSize: 14,
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
  arrow: {
    color: Constants.white,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topcov:{
    flexDirection:'row',
    gap:'18%',
    alignSelf:"flex-start",
    alignItems:'center'
  }
});