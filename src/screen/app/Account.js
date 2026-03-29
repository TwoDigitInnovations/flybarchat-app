import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { createRef, useEffect, useState} from 'react';
import Constants, { FONTS, LANGUAGES} from '../../Assets/Helpers/constant';
// import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useDispatch, useSelector } from 'react-redux';
import { navigate } from '../../../utils/navigationRef';
import { logout } from '../../../redux/auth/authAction';
import { CrossIcon,
  DeleteIcon,
  LogoutIcon,
  PrivacyIcon,
  ProfileIcon,
  RightArrowIcon,
  SupportIcon,
  TermIcon, } from '../../Assets/theme';
import { useTranslation } from 'react-i18next';

const Account = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const user = useSelector(state => state.auth.user);
  
  const selectedCode = useSelector(state => state.language.langCode);
  const selectedLang = LANGUAGES.find(l => l.code === selectedCode);
  
  const InAppBrowserFunc=async(props)=>{
    return
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(props, {
          // Customization options
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: Constants.custom_blue,
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          enableBarCollapsing: false,
        });
      } else {
        Linking.openURL(props);
      }
    } catch (error) {
      console.error(error);
    }
  }
  const logOut=()=>{
dispatch(logout())
  }
  return (
    <View style={styles.container}>
      <Text style={styles.headtxt}>{t("Profile Settings")}</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.topcard}
          onPress={() => navigate('Profile')}>
          <Image
            // source={require('../../../Assets/Images/profile.png')}
            source={
              user?.image
                ? {
                    uri: `${user.image}`,
                  }
                : require('../../Assets/Images/profile2.png')
            }
            style={styles.proimg}
          />
          <View style={{marginTop: 5, alignItems: 'center'}}>
            <Text style={styles.protxt}>{user?.name}</Text>
            <Text style={styles.protxt2}>{user?.phone}</Text>
          </View>
        </TouchableOpacity>
        <View style={[styles.horline, {marginHorizontal: 20}]}></View>
        <View
          style={{
            marginTop: 10,
            backgroundColor: Constants.light_black,
            marginBottom: 70,
          }}>
          <Text style={styles.partheadtxt}>{t("Profile")}</Text>
          <TouchableOpacity
            style={[styles.box]}
            onPress={() => navigate('Profile')}>
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <ProfileIcon height={20} width={20} color={Constants.white}/>
              </View>
              <Text style={styles.protxt}>{t("Personal Data")}</Text>
            </View>
            <RightArrowIcon
              color={Constants.white}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.box]}
            onPress={() =>InAppBrowserFunc(`https://www.admin.bokakorning.online/privacypolicy`)}
            >
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <PrivacyIcon height={20} width={20} color={Constants.white}/>
              </View>
              <Text style={styles.protxt}>{t("Privacy Policy")}</Text>
            </View>
            <RightArrowIcon
              color={Constants.white}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.box]}
            onPress={() =>InAppBrowserFunc(`https://www.admin.bokakorning.online/termsandconditions`)}
            >
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <TermIcon height={20} width={20} color={Constants.white}/>
              </View>
              <Text style={styles.protxt}>{t("Terms and Conditions")}</Text>
            </View>
            <RightArrowIcon
              color={Constants.white}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.box]}
            onPress={() =>navigate('Auth',{screen:'LanguageChange'})}
            >
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <TermIcon height={20} width={20} color={Constants.white}/>
              </View>
              <Text style={styles.protxt}>{t("Language")}</Text>
            </View>
            <View style={styles.btmboxfirpart}>
              <Text style={styles.protxt3}>{selectedLang?.native}</Text>
            <RightArrowIcon
              color={Constants.white}
              height={15}
              width={15}
              style={styles.aliself}
            />
            </View>
          </TouchableOpacity>
          <Text style={styles.partheadtxt}>{t("Support")}</Text>
          <TouchableOpacity
            style={[styles.box]}
            onPress={() => InAppBrowserFunc('https://tawk.to/chat/68e0fa0c4db84c19518e60e8/1j6nd1gbd')}
            >
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <SupportIcon height={20} width={20} color={Constants.white}/>
              </View>
              <Text style={styles.protxt}>{t("Help Center")}</Text>
            </View>
            <RightArrowIcon
              color={Constants.white}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.box]}
            onPress={() => setModalVisible2(true)}>
            <View style={styles.btmboxfirpart}>
              <View style={styles.iconcov}>
                <DeleteIcon height={20} width={20} color={Constants.white} />
              </View>
              <Text style={[styles.protxt,{width:'70%'}]}>{t("Request Account Deletion")}</Text>
            </View>
            <RightArrowIcon
              color={Constants.white}
              height={15}
              width={15}
              style={styles.aliself}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn]}
            onPress={async () => {
              setModalVisible(true);
            }}>
            <LogoutIcon color={Constants.red}/>
            <Text style={styles.btntxt}>{t("Log Out")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
{/* <LanguageChange refs={langRef} selLang={(item)=>{setSelectLanguage(item)}}/> */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={{backgroundColor: Constants.light_black, alignItems: 'center'}}>
              <View style={[styles.covline,{width:'100%'}]}>
                <View style={{width:35}}></View>
                <Text style={styles.textStyle5}>{t("Sign Out")}</Text>
                <TouchableOpacity style={styles.croscov} onPress={()=>setModalVisible(false)}>
                  <CrossIcon color={Constants.white}/>
                </TouchableOpacity>
              </View>
              <Text style={styles.textStyle4}>{t("Are you sure you want to log out?")}</Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible(!modalVisible)}
                  style={styles.cancelButtonStyle2}>
                  <Text style={styles.modalText}>{t("Cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={async () => {
                    setModalVisible(!modalVisible);
                    logOut();
                  }}
                  style={styles.logOutButtonStyle2}>
                  <Text style={styles.modalText}>{t("Log Out")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible2}
        onRequestClose={() => {
          // Alert.alert('Modal has been closed.');
          setModalVisible2(!modalVisible2);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={{backgroundColor: Constants.light_black, alignItems: 'center'}}>
              <Text style={[styles.textStyle2, {color: Constants.red}]}>
                {t("WARNING: You are about to delete your account. This action is permanent and cannot be undone.")}
              </Text>
              <Text style={styles.textStyle3}>
                {t("• All your data, including personal information, and settings, will be permanently erased.")}
              </Text>
              <Text style={styles.textStyle3}>
                {t("• You will lose access to all services and benefits associated with your account.")}
              </Text>
              <Text style={styles.textStyle3}>
                {t("• You will no longer receive updates, support, or communications from us.")}
              </Text>
              <Text style={styles.textStyle}>
                {t("Are you sure you want to delete your account?")}
              </Text>
              <View style={styles.cancelAndLogoutButtonWrapStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setModalVisible2(!modalVisible2)}
                  style={styles.cancelButtonStyle}>
                  <Text style={[styles.modalText,{color:Constants.black}]}>{t("Cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={async () => {
                    setModalVisible2(!modalVisible2);
                    logOut();
                  }}
                  style={styles.logOutButtonStyle}>
                  <Text style={styles.modalText}>{t("Delete Account")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.light_black,
    // paddingVertical: 20,
  },
  headtxt: {
    fontSize: 16,
    color: Constants.white,
    fontFamily: FONTS.SemiBold,
    textAlign: 'center',
    marginTop: 10,
  },
  protxt: {
    color: Constants.white,
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
  },
  protxt2: {
    color: Constants.customgrey2,
    fontSize: 12,
    fontFamily: FONTS.Regular,
  },
  box: {
    paddingHorizontal: 15,
    marginVertical: 10,
    backgroundColor: Constants.light_black,
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aliself: {
    alignSelf: 'center',
  },
  btntxt: {
    fontSize: 16,
    color: Constants.red,
    fontFamily: FONTS.SemiBold,
  },
  btn: {
    height: 55,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    borderColor: Constants.customgrey2,
    borderWidth: 1,
    marginHorizontal: 20,
    // width: '80%',
    // alignSelf: 'center',
    marginBottom: 30,
    marginTop: 10,
    gap:10,
  },
  proimg: {
    // marginRight: 10,
    height: 70,
    width: 70,
    borderRadius: 70,
  },
  /////////logout model //////
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 22,
    backgroundColor: '#rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 17,
    backgroundColor: Constants.light_black,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
    borderWidth:1,
    borderColor:Constants.custom_red
  },

  textStyle: {
    color: Constants.white,
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 16,
  },
  textStyle5: {
    color: Constants.white,
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 18,
  },
  textStyle4: {
    color: Constants.customgrey2,
    textAlign: 'center',
    fontFamily: FONTS.Medium,
    fontSize: 14,
    marginTop:10
  },
  textStyle2: {
    color: Constants.white,
    textAlign: 'center',
    fontFamily: FONTS.Medium,
    fontSize: 16,
  },
  textStyle3: {
    color: Constants.white,
    textAlign: 'center',
    fontFamily: FONTS.Regular,
    fontSize: 16,
  },
  modalText: {
    color: Constants.white,
    textAlign: 'center',
    fontFamily: FONTS.Bold,
    fontSize: 14,
  },
  cancelAndLogoutButtonWrapStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 3,
  },
  cancelButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.white,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginRight: 10,
  },
  logOutButtonStyle: {
    flex: 0.5,
    backgroundColor: Constants.red,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  cancelButtonStyle2: {
    flex: 0.5,
    borderColor: Constants.customgrey2,
    borderWidth:1,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginRight: 10,
  },
  logOutButtonStyle2: {
    flex: 0.5,
    backgroundColor: Constants.custom_red,
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  covline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horline: {
    height: 1,
    backgroundColor: Constants.customgrey2,
    marginVertical: 10,
  },
  partheadtxt: {
    fontSize: 14,
    color: Constants.customgrey2,
    fontFamily: FONTS.Medium,
    marginTop: 20,
    marginLeft: 20,
  },
  iconcov: {
    backgroundColor: Constants.customgrey,
    borderRadius: 8,
    padding: 10,
  },
  croscov:{
    padding:10,
    borderRadius:8,
    borderWidth:1,
    borderColor:Constants.customgrey5
  },
  topcard: {
    marginHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  protxt3: {
    color: Constants.white,
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
  btmboxfirpart: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15
  },
});
