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
          { backgroundColor: isSelected ? Constants.white : Constants.SURFACE },
        ]}
        onPress={() => {
          setSelectLanguage(item.name);
          setSelectCode(item.code);
        }}>
        <View style={styles.flagCircle}>
          <Text style={styles.flagEmoji}>{item.flag}</Text>
        </View>
        <Text style={[styles.langName, { color: isSelected ? Constants.black : Constants.white }]}>
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
          source={require('../../Assets/Images/barImg2.png')}
          style={styles.heroImg}
          resizeMode="cover"
        />
      </View>

      {/* ── Static header content — does NOT flex-grow ── */}
      <View style={styles.staticHeader}>
        <View style={styles.appTitleRow}>
          <Text style={styles.appTitle}>{t('FLAY CHAT BAR')} </Text>
          <MocktailIcon height={22} width={22} />
        </View>

        <Text style={styles.pageHeading}>{t('Select  the language')}</Text>
        <Text style={styles.pageSubtitle}>
          {t('Select your preferred language below This helps us serve you better.')}
        </Text>

        <Text style={styles.sectionLabel}>{t('You Selected')}</Text>
        <View style={styles.selectedBox}>
          <View style={styles.flagCircleLg}>
            <Text style={styles.flagEmojiLg}>{selectedItem?.flag}</Text>
          </View>
          <Text style={styles.selectedLangName}>{selectedItem?.native}</Text>
          <View style={styles.checkCircle}>
            <ThikIcon />
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('All Languages')}</Text>

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
      </View>

      {/* ✅ FlatList gets ALL remaining vertical space via flex:1 */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.code}
        renderItem={renderItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"  // ✅ tap items without dismissing keyboard
        contentContainerStyle={styles.listContent}
      />

      {/* ── Continue Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueBtn}
          activeOpacity={0.85}
          onPress={handleContinue}>
          <Text style={styles.continueBtnText}>{t('Continue')}</Text>
        </TouchableOpacity>
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
    height: 170,
    overflow: 'hidden',
  },
  heroImg: {
    width: '100%',
    height: '100%',
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
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS?.Bold,
    letterSpacing: 1.5,
  },
  pageHeading: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS?.SemiBold ,
    marginBottom: 6,
  },
  pageSubtitle: {
    color: Constants.customgrey3,
    fontSize: 14,
    fontFamily: FONTS?.Regular ,
    lineHeight: 18,
    marginBottom: 18,
  },

  selectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Constants.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Constants.BORDER,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 18,
  },
  flagCircleLg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Constants.customgrey,
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
    color: Constants.white,
    fontSize: 14,
    fontFamily: FONTS?.SemiBold,
    marginBottom: 5,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Constants.custom_red,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Constants.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Constants.BORDER,
    paddingHorizontal: 14,
    marginBottom: 10,
    height: 46,
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
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 8,
  },

  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Constants.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Constants.BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  flagCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2F38',
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
    borderColor: Constants.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Constants.custom_red,
    backgroundColor: Constants.custom_red,
  },

  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 10,
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