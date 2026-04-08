import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import { setLanguage } from '../../../redux/language/languageSlice';
import Constants, { FONTS, LANGUAGES } from '../../Assets/Helpers/constant';
import { goBack } from '../../../utils/navigationRef';
import { MocktailIcon, SearchIcon, ThikIcon } from '../../Assets/theme';

const LanguageChange = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [selectLanguage, setSelectLanguage] = useState('English');
  const [selectCode, setSelectCode] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      const code = await AsyncStorage.getItem('LANG');
      if (code) {
        const found = LANGUAGES.find(i => i.code === code);
        if (found) {
          setSelectLanguage(found.name);
          setSelectCode(found.code);
          dispatch(setLanguage(found.code));
        }
      }
    })();
  }, []);

  const filteredData = LANGUAGES.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.native.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedItem = LANGUAGES.find(i => i.name === selectLanguage);

  const handleContinue = async () => {
    await AsyncStorage.setItem('LANG', selectCode);
    i18n.changeLanguage(selectCode);
    dispatch(setLanguage(selectCode));
    goBack();
  };

  const renderItem = ({ item }) => {
    const isSelected = selectLanguage === item.name;
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={[
          styles.langRow,
          { backgroundColor: isSelected ? Constants.white : null },
        ]}
        onPress={() => {
          setSelectLanguage(item.name);
          setSelectCode(item.code);
        }}>
        <View style={styles.flagCircle}>
          <Text style={styles.flagEmoji}>{item.flag}</Text>
        </View>
        <Text style={[styles.langName, { color: isSelected ? Constants.black : Constants.dark_black }]}>
          {item.native}
        </Text>
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && <ThikIcon />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>

      {/* ── Hero Banner — outside the scrollable/flex area ── */}
      <View style={styles.heroBanner}>
        <Image
          source={require('../../Assets/Images/barImg.png')}
          style={styles.heroImg}
          // resizeMode="cover"
        />
      </View>
      <View style={styles.headerSpacer}>

      {/* ── Static header content — does NOT flex-grow ── */}
      <View style={styles.staticHeader}>
        {/* <View style={styles.appTitleRow}>
          <Text style={styles.appTitle}>{t('FLAY CHAT BAR')} </Text>
          <MocktailIcon height={22} width={22} />
        </View> */}
        <Text style={styles.appTitle}>{t('Your Conversation,Your Language.')}</Text>

        {/* <Text style={styles.pageHeading}>{t('Select  the language')}</Text> */}
        <Text style={styles.pageSubtitle}>
          {t('Select your preferred language below This helps us serve you better.')}
        </Text>

        <Text style={styles.sectionLabel}>{t('You Selected')}</Text>
        <View style={styles.selectedBox}>
          <View style={styles.flagCircleLg}>
            <Text style={styles.flagEmojiLg}>{selectedItem?.flag}</Text>
          </View>
          <Text style={styles.selectedLangName}>{selectedItem?.native}</Text>
            <ThikIcon height={28} width={28}/>
        </View>

        <Text style={styles.sectionLabel}>{t('All Languages')}</Text>

      </View>
      <View style={styles.listContainer}>
        <View style={styles.searchBox}>
          <SearchIcon height={20} width={20} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search')}
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

      {/*FlatList gets ALL remaining vertical space via flex:1 */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.code}
        renderItem={renderItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"  // tap items without dismissing keyboard
        contentContainerStyle={styles.listContent}
      />
      </View>

      {/* ── Continue Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueBtn}
          activeOpacity={0.85}
          onPress={handleContinue}>
          <Text style={styles.continueBtnText}>{t('Continue')}</Text>
        </TouchableOpacity>
      </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LanguageChange;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Constants.light_black,
  },

  heroBanner: {
    height: '37%',
    overflow: 'hidden',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  headerSpacer:{
    flex:1,
    backgroundColor: Constants.light_black,
    marginTop: -100,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  // ✅ Static header — no flex, just wraps its content
  staticHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  appTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    justifyContent: 'center',
  },
  appTitle: {
    color: Constants.black,
    fontSize: 22,
    fontFamily: FONTS?.Bold,
    letterSpacing: 1.5,
  },
  pageHeading: {
    color: Constants.black,
    fontSize: 18,
    fontFamily: FONTS?.SemiBold ,
    marginBottom: 6,
  },
  pageSubtitle: {
    color: Constants.black,
    fontSize: 14,
    fontFamily: FONTS?.Regular ,
    lineHeight: 18,
    marginBottom: 18,
  },

  selectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Constants.white,
    borderRadius: 30,
    // borderWidth: 1,
    // borderColor: Constants.BORDER,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 18,
  },
  flagCircleLg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Constants.light_pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  flagEmojiLg: { fontSize: 22 },
  selectedLangName: {
    flex: 1,
    color: Constants.black,
    fontSize: 15,
    fontFamily: FONTS?.SemiBold,
  },
  sectionLabel: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS?.SemiBold,
    marginBottom: 5,
  },
  listContainer: { 
    flex:1,
    borderWidth:1,
    borderColor: Constants.black,
    borderRadius: 14,
    marginHorizontal: 20,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: Constants.SURFACE,
    // borderRadius: 12,
    borderBottomWidth: 1,
    borderColor: Constants.black,
    paddingHorizontal: 14,
    // marginBottom: 10,
    height: 46,
    // marginHorizontal:20
  },
  searchInput: {
    flex: 1,
    color: Constants.white,
    fontSize: 14,
    fontFamily: FONTS?.Regular,
    paddingVertical: 0,
  },

  // ✅ FlatList takes all remaining space
  list: {
    flex: 1,
    // paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 8,
  },

  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: Constants.SURFACE,
    // borderRadius: 12,
    // borderWidth: 1,
    // borderColor: Constants.BORDER,
    paddingHorizontal: 10,
    paddingVertical: 10,
    // marginBottom: 8,
  },
  flagCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Constants.light_pink2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flagEmoji: { fontSize: 20 },
  langName: {
    flex: 1,
    color: Constants.white,
    fontSize: 14,
    fontFamily: FONTS?.SemiBold,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Constants.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Constants.custom_red,
    backgroundColor: Constants.custom_red,
  },

  bottomBar: {
    paddingHorizontal: 20,
    // paddingBottom: 10,
    paddingTop: 8,
  },
  continueBtn: {
    height: 50,
    backgroundColor: Constants.custom_red,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS?.SemiBold,
    letterSpacing: 0.5,
  },
});