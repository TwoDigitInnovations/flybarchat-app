import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ActionSheet from 'react-native-actions-sheet';
import {CrossIcon, Thik2Icon} from '../../../Theme';
import Constants, {FONTS} from '../Helpers/constant';
import {useTranslation} from 'react-i18next';
import i18n from '../../../i18n';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../../../redux/location/locationSlice';

const LanguageChange = props => {
  const [selectLanguage, setSelectLanguage] = useState('English');
  const [selectCode, setSelectCode] = useState('en');
  const dispatch = useDispatch();

  useEffect(() => {
    checkLng();
  }, []);
  const checkLng = async () => {
  const code = await AsyncStorage.getItem('LANG');

  if (code) {
    const selected = countrydata.find(i => i.code === code);
    if (selected) {
      setSelectLanguage(selected.name);
      setSelectCode(selected.code);
      dispatch(setLanguage(selected.code));
    }
  }
};
  const countrydata = [
  {name: 'English', code: 'en', flag: '🇺🇸'},
  {name: 'French', code: 'fr', flag: '🇫🇷'},
  {name: 'German', code: 'de', flag: '🇩🇪'},
  {name: 'Spanish', code: 'es', flag: '🇪🇸'},
  {name: 'Portuguese', code: 'pt', flag: '🇵🇹'},
  {name: 'Arabic', code: 'ar', flag: '🇸🇦'},
  {name: 'Hindi', code: 'hi', flag: '🇮🇳'},
  {name: 'Sinhala', code: 'si', flag: '🇱🇰'},
  {name: 'Tamil', code: 'ta', flag: '🇮🇳'},
  {name: 'Romanian', code: 'ro', flag: '🇷🇴'},
  {name: 'Russian', code: 'ru', flag: '🇷🇺'},
  {name: 'Ukrainian', code: 'uk', flag: '🇺🇦'},
  {name: 'Polish', code: 'pl', flag: '🇵🇱'},
  {name: 'Bulgarian', code: 'bg', flag: '🇧🇬'},
  ];
  return (
    <ActionSheet
      ref={props?.refs}
      closeOnTouchBackdrop={true}
      containerStyle={{
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}>
      <View
        style={[
          styles.modal,
          {
            backgroundColor: Constants.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
        ]}>
        <View style={styles.headcov}>
          <Text style={[styles.heading, {color: Constants.black}]}>
            {t("Select Language")}
          </Text>
          <CrossIcon
            height={25}
            width={25}
            style={{alignSelf: 'center'}}
            color={Constants.black}
            onPress={() => props?.refs.current.hide()}
          />
        </View>

        <FlatList
          data={countrydata}
          renderItem={({item, index}) => (
            <TouchableOpacity
              style={[
                styles.item,
                {
                  borderColor:
                    selectLanguage === item?.name
                      ? Constants.normal_green
                      : Constants.customgrey5,
                },
              ]}
              onPress={ () => {
                setSelectLanguage(item?.name);
                setSelectCode(item?.code);
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={styles.flagcov}>
                  <Text>{item?.flag}</Text>
                </View>
                <Text style={[styles.itemTxt, {color: Constants.black}]}>
                  {item?.name}
                </Text>
              </View>
              {selectLanguage == item?.name && (
                <Thik2Icon color={Constants.normal_green} />
              )}
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity
              style={styles.btncov}
              onPress={async () => {
                await AsyncStorage.setItem('LANG', selectCode);
                i18n.changeLanguage(selectCode);
                props.selLang(selectLanguage);
                props?.refs.current.hide();
                dispatch(setLanguage(selectCode))
              }}>
              <Text style={styles.btntxt}>Select</Text>
            </TouchableOpacity>
      </View>
    </ActionSheet>
  );
};

export default LanguageChange;

const styles = StyleSheet.create({
  modal: {
    paddingBottom: 20,
    backgroundColor: Constants.white,
  },
  heading: {
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.SemiBold,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    height: 60,
    borderWidth: 1,
    width: '90%',
    alignSelf: 'center',
    marginTop: 15,
    borderRadius: 13,
    paddingHorizontal: 20,
  },
  itemTxt: {
    marginLeft: 20,
    fontSize: 14,
    color: Constants.black,
    fontFamily: FONTS.SemiBold,
  },
  headcov: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
  },
  flagcov: {
    backgroundColor: '#F3F6FB',
    borderRadius: 30,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
    btncov: {
    height: 50,
    backgroundColor: Constants.custom_blue,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 15,
    width: '90%',
    alignSelf: 'center',
  },
   btntxt: {
    fontSize: 16,
    color: Constants.white,
    fontFamily: FONTS.SemiBold,
  },
});
