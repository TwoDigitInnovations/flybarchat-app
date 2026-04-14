import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {createRef, useEffect, useRef, useState} from 'react';
import Constants, {checkEmail, FONTS, getZodiacSign} from '../../Assets/Helpers/constant';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import { goBack, reset } from '../../../utils/navigationRef';
import { getProfile, updateProfile } from '../../../redux/auth/authAction';
import { useDispatch } from 'react-redux';
import { showToaster } from '../../../utils/toaster';
import {BackIcon, CameraIcon} from '../../Assets/theme';
import { Dropdown } from 'react-native-element-dropdown';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTranslation } from 'react-i18next';

const Profile = (props) => {
  const { t } = useTranslation();
  const data = props?.route?.params;
  const dispatch = useDispatch();
  const [submitted, setSubmitted] = useState(false);
  const [edit, setEdit] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [dateModel, setDateModel] = useState(false);
  const [userDetail, setUserDetail] = useState({
    name: '',
    phone: '',
    email: '',
    image:'',
    dob:'',
  });

  const dropdownRef = useRef();
  const dropdownRef2 = useRef();
  const dropdownRef3 = useRef();
  const dropdownRef4 = useRef();
  const dropdownRef5 = useRef();
  const dropdownRef6 = useRef();
  const dropdownRef7 = useRef();
  const dropdownRef8 = useRef();

   const genderlist = [
    { label: t('Men'), value: 'Men' },
    { label: t('Women'), value: 'Women' },
    { label: t('Other'), value: 'Other' },
  ];
   const professionlist = [
    { label: t('Operaio'), value: 'Operaio' },
    { label: t('Libero professionista'), value: 'Libero professionista' },
    { label: t('Studente'), value: 'Studente' },
    { label: t('Disoccupato'), value: 'Disoccupato' },
    { label: t('Pensionato'), value: 'Pensionato' },
    { label: t('Altro'), value: 'Altro' },
  ];


  const agelist = [
    { label: '18-25', value: '18-25' },
    { label: '26-44', value: '26-44' },
    { label: '45-over', value: '45-over' },
  ];
  const eyecolorlist = [
   { label: t('Brown'), value: 'Brown' },
   { label: t('Blue'), value: 'Blue' },
   { label: t('Green'), value: 'Green' },
   { label: t('Hazel'), value: 'Hazel' },
   { label: t('Gray'), value: 'Gray' },
   { label: t('Black'), value: 'Black' },
   { label: t('Other'), value: 'Other' },
 ];
  const haircolorlist = [
   { label: t('Black'), value: 'Black' },
   { label: t('Brown'), value: 'Brown' },
   { label: t('Blonde'), value: 'Blonde' },
   { label: t('Red'), value: 'Red' },
   { label: t('Gray'), value: 'Gray' },
   { label: t('White'), value: 'White' },
   { label: t('Bald'), value: 'Bald' },
   { label: t('Other'), value: 'Other' },
 ];
  const relationshiplist = [
   { label: t('Single'), value: 'Single' },
   { label: t('Engaged'), value: 'Engaged' },
   { label: t('Married'), value: 'Married' },
   { label: t('Divorced'), value: 'Divorced' },
   { label: t('Cohabiting'), value: 'Cohabiting' },
 ];
 const heightUnits = [
    { label: 'CM', value: 'CM' },
    { label: 'FT', value: 'FT' },
  ];

  const getImageValue = async img => {
    setUserDetail({...userDetail,image:img});
  };

  useEffect(() => {
      getProdata()
    }, []);

    const onDateChange=(event,selectDate)=>{
  if (event.type === "dismissed") {
    // User cancelled → do not update date
    setDateModel(false);
    return;
  }
setUserDetail({...userDetail, dob:selectDate})
setDateModel(false)
}
  
    const getProdata = () => {
        dispatch(getProfile())
          .unwrap()
          .then(data => {
            console.log('data', data);
            setUserDetail(data);
          })
          .catch(error => {
            console.error('getProfile failed:', error);
          });
      };
    const submit = () => {
      if (
      !userDetail.name ||
      userDetail.phone === '' ||
      !userDetail.phone||!userDetail?.email||
      !userDetail?.dob|| !userDetail?.country||
      !userDetail?.city||!userDetail?.gender||!userDetail?.looking_for||!userDetail?.age_range||!userDetail?.eyeColor||!userDetail?.hairColor||!userDetail?.profession||!userDetail?.relationship_status||!userDetail?.height||!userDetail?.height_unit
      ) {
        setSubmitted(true);
        return;
      }
       const emailcheck = checkEmail(userDetail.email.trim());
    if (!emailcheck) {
      showToaster('error',"Your email id is invalid");
      return;
    }
    if (!userDetail?.image) {
      showToaster('error',"Please upload profile picture");
      return;
    }

    const dob = new Date(userDetail.dob);
const day = dob.getDate();
const month = dob.getMonth() + 1;
const zodiac = getZodiacSign(day, month);

        const formData = new FormData();
        formData.append('name', userDetail.name);
        formData.append('phone', userDetail.phone);
        formData.append('email', userDetail.email);
        formData.append('dob', (userDetail.dob).toString());
        formData.append('gender', userDetail.gender);
        formData.append('age_range', userDetail.age_range);
        formData.append('looking_for', userDetail.looking_for);
        formData.append('country', userDetail.country);
        formData.append('city', userDetail.city);
        formData.append('eyeColor', userDetail.eyeColor);
        formData.append('hairColor', userDetail.hairColor);
        formData.append('profession', userDetail.profession);
        formData.append('relationship_status', userDetail.relationship_status);
        formData.append('height', userDetail.height);
        formData.append('height_unit', userDetail.height_unit);
        formData.append('zodiac', zodiac);
        if (userDetail?.image?.uri) {
          formData.append('image', userDetail?.image);
        }
        dispatch(updateProfile(formData))
          .unwrap()
          .then(data => {
            console.log('data', data);
            reset('App');
            // goBack()
          })
          .catch(error => {
            console.error('UpdateProfile failed:', error);
          });
      };
  return (
    <KeyboardAvoidingView
          style={{flex:1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
    <ScrollView
      style={[styles.container]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always">
      <View style={{flexDirection: 'row', gap:20}}>
       {/* <TouchableOpacity style={styles.backcov} onPress={() => goBack()}> */}
               <BackIcon  onPress={() => goBack()} color={Constants.black}/>
                 {/* </TouchableOpacity> */}
        <Text style={styles.headtxt}>{t("Personal Data")}</Text>
        <View></View>
      </View>

      <TouchableOpacity style={styles.imgpart} onPress={() => setShowImagePicker(true)}>
        {/* {edit && (
          <Pressable
            style={styles.editiconcov}
            onPress={() => cameraRef.current.show()}>
            <EditIcon height={15} color={Constants.white} />
          </Pressable>
        )} */}
        {userDetail?.image?.uri?<Image
          source={{uri: `${userDetail.image.uri}`}}
          style={styles.logo}
        />:
        userDetail?.image?<Image
          source={{uri: `${userDetail.image}`}}
          style={styles.logo}
        />:<CameraIcon width={50} height={50} color={Constants.black}/>}
      </TouchableOpacity>

        <Text style={styles.label}>{t("Full Name")}</Text>
        <TextInput
          style={styles.input}
          // editable={edit}
          placeholder="Enter Name"
          value={userDetail?.name}
          onChangeText={name => setUserDetail({...userDetail, name})}
          placeholderTextColor={Constants.greish_pink}
        />
      {submitted && !userDetail.name && (
        <Text style={styles.require}>{t("Name is required")}</Text>
      )}
      <Text style={styles.label}>{t("Email")}</Text>
        <TextInput
          style={styles.input}
          // editable={edit}
          placeholder={t("Enter Email")}
          value={userDetail?.email}
          onChangeText={email => setUserDetail({...userDetail, email})}
          placeholderTextColor={Constants.greish_pink}
        />
        {submitted && !userDetail.email && (
        <Text style={styles.require}>{t("Email is required")}</Text>
      )}

      <Text style={styles.label}>{t("Gender")}</Text>
      <Dropdown
          ref={dropdownRef}
          data={genderlist}
          labelField="label"
          valueField="value"
          placeholder={t("Select gender")}
          value={userDetail?.gender}
          onChange={item => setUserDetail({...userDetail, gender: item.value})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, gender: dditem.value });
                dropdownRef.current?.close();
              }}>
              <Text style={styles.itemText}>{dditem.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.selectedText}
          itemTextStyle={styles.itemText}
          itemContainerStyle={styles.itemContainerStyle}
          selectedItemStyle={styles.selectedStyle}
          iconColor={Constants.black}
        />

        {submitted && !userDetail.gender && (
        <Text style={styles.require}>{t("Gender is required")}</Text>
      )}

        <Text style={styles.label}>{t("Phone Number")}</Text>
        <TextInput
          style={styles.input}
          // editable={edit}
          placeholder={t("Enter Number")}
          value={userDetail?.phone}
          onChangeText={phone => setUserDetail({...userDetail, phone})}
          placeholderTextColor={Constants.greish_pink}
        />
      {submitted && !userDetail.phone && (
        <Text style={styles.require}>{t("Number is required")}</Text>
      )}
        <Text style={styles.label}>{t("Profession")}</Text>
        {/* <TextInput
          style={styles.input}
          // editable={edit}
          placeholder={t("Enter Profession")}
          value={userDetail?.profession}
          onChangeText={profession => setUserDetail({...userDetail, profession})}
          placeholderTextColor={Constants.greish_pink}
        /> */}
        <Dropdown
          ref={dropdownRef8}
          data={professionlist}
          labelField="label"
          valueField="value"
          placeholder={t("Select profession")}
          value={userDetail?.profession}
          onChange={item => setUserDetail({...userDetail, profession: item.value})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, profession: dditem.value });
                dropdownRef8.current?.close();
              }}>
              <Text style={styles.itemText}>{dditem.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.selectedText}
          itemTextStyle={styles.itemText}
          itemContainerStyle={styles.itemContainerStyle}
          selectedItemStyle={styles.selectedStyle}
          iconColor={Constants.black}
        />
      {submitted && !userDetail.profession && (
        <Text style={styles.require}>{t("Profession is required")}</Text>
      )}
        <Text style={styles.label}>{t("Date of Birth")}</Text>
        <Text style={[styles.input2,{color:userDetail?.dob?Constants.black:Constants.greish_pink}]} onPress={() => setDateModel(true)}>{userDetail?.dob ? moment(userDetail?.dob).format('DD MMM YYYY') : t("Select Date")}</Text>
      {submitted && !userDetail.dob && (
        <Text style={styles.require}>{t("Date of Birth is required")}</Text>
      )}
      {dateModel&&<DateTimePicker
        mode='date'
        textColor='black'
        // minimumDate={new Date()}
        value={userDetail?.dob?new Date(userDetail?.dob):new Date()}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={onDateChange}
      />}

      <View style={styles.frw}>
        <View style={{flex:1,marginRight:15}}>
            <Text style={styles.label}>{t("Country")}</Text>
        <TextInput
          style={[styles.input,{flex:1}]}
          // editable={edit}
          placeholder={t("Enter Country")}
          value={userDetail?.country}
          onChangeText={country => setUserDetail({...userDetail, country})}
          placeholderTextColor={Constants.greish_pink}
        />
      {submitted && !userDetail.country && (
        <Text style={styles.require}>{t("Country is required")}</Text>
      )}
        </View>
        <View style={{flex:1}}>
            <Text style={styles.label}>{t("City")}</Text>
        <TextInput
          style={[styles.input,{flex:1}]}
          // editable={edit}
          placeholder={t("Enter City")}
          value={userDetail?.city}
          onChangeText={city => setUserDetail({...userDetail, city})}
          placeholderTextColor={Constants.greish_pink}
        />
      {submitted && !userDetail.city && (
        <Text style={styles.require}>{t("City is required")}</Text>
      )}
        </View>
      </View>

      <View style={styles.frw}>
        <View style={{flex:1,marginRight:15}}>
            <Text style={styles.label}>{t("Height")}</Text>
        <TextInput
          style={[styles.input,{flex:1}]}
          // editable={edit}
          placeholder={t("Enter Height")}
          keyboardType='number-pad'
          value={userDetail?.height}
          onChangeText={height => setUserDetail({...userDetail, height})}
          placeholderTextColor={Constants.greish_pink}
        />
      {submitted && !userDetail.height && (
        <Text style={styles.require}>{t("Height is required")}</Text>
      )}
        </View>
        <View style={{flex:1}}>
            <Text style={styles.label}>{t("Height Unit")}</Text>

        <Dropdown
          ref={dropdownRef7}
          data={heightUnits}
          labelField="label"
          valueField="value"
          placeholder={t("Select height unit")}
          value={userDetail?.height_unit}
          onChange={item => setUserDetail({...userDetail, height_unit: item.value})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, height_unit: dditem.value });
                dropdownRef7.current?.close();
              }}>
              <Text style={styles.itemText}>{dditem.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.selectedText}
          itemTextStyle={styles.itemText}
          itemContainerStyle={styles.itemContainerStyle}
          selectedItemStyle={styles.selectedStyle}
          iconColor={Constants.black}
        />

      {submitted && !userDetail.height_unit && (
        <Text style={styles.require}>{t("Height Unit is required")}</Text>
      )}
        </View>
      </View>

      <Text style={styles.label}>{t("Eye Colour")}</Text>
      <Dropdown
          ref={dropdownRef4}
          data={eyecolorlist}
          labelField="label"
          valueField="value"
          placeholder={t("Select eye colour")}
          value={userDetail?.eyeColor}
          onChange={item => setUserDetail({...userDetail, eyeColor: item.value})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, eyeColor: dditem.value });
                dropdownRef4.current?.close();
              }}>
              <Text style={styles.itemText}>{dditem.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.selectedText}
          itemTextStyle={styles.itemText}
          itemContainerStyle={styles.itemContainerStyle}
          selectedItemStyle={styles.selectedStyle}
          iconColor={Constants.black}
        />
        {submitted && !userDetail.eyeColor && (
        <Text style={styles.require}>{t("Eye Colour is required")}</Text>
        )}

      <Text style={styles.label}>{t("Hair Colour")}</Text>
      <Dropdown
          ref={dropdownRef5}
          data={haircolorlist}
          labelField="label"
          valueField="value"
          placeholder={t("Select hair colour")}
          value={userDetail?.hairColor}
          onChange={item => setUserDetail({...userDetail, hairColor: item.value})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, hairColor: dditem.value });
                dropdownRef5.current?.close();
              }}>
              <Text style={styles.itemText}>{dditem.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.selectedText}
          itemTextStyle={styles.itemText}
          itemContainerStyle={styles.itemContainerStyle}
          selectedItemStyle={styles.selectedStyle}
          iconColor={Constants.black}
        />
        {submitted && !userDetail.hairColor && (
        <Text style={styles.require}>{t("Hair Colour is required")}</Text>
        )}
      <Text style={styles.label}>{t("Relationship Status")}</Text>
      <Dropdown
          ref={dropdownRef6}
          data={relationshiplist}
          labelField="label"
          valueField="value"
          placeholder={t("Select Relationship Status")}
          value={userDetail?.relationship_status}
          onChange={item => setUserDetail({...userDetail, relationship_status: item.value})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, relationship_status: dditem.value });
                dropdownRef6.current?.close();
              }}>
              <Text style={styles.itemText}>{dditem.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.selectedText}
          itemTextStyle={styles.itemText}
          itemContainerStyle={styles.itemContainerStyle}
          selectedItemStyle={styles.selectedStyle}
          iconColor={Constants.black}
        />
        {submitted && !userDetail.relationship_status && (
        <Text style={styles.require}>{t("Relationship Status is required")}</Text>
        )}

      <Text style={styles.label}>{t("Looking For")}</Text>
      <Dropdown
          ref={dropdownRef2}
          data={genderlist}
          labelField="label"
          valueField="value"
          placeholder={t("Select gender")}
          value={userDetail?.looking_for}
          onChange={item => setUserDetail({...userDetail, looking_for: item.value})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, looking_for: dditem.value });
                dropdownRef2.current?.close();
              }}>
              <Text style={styles.itemText}>{dditem.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.selectedText}
          itemTextStyle={styles.itemText}
          itemContainerStyle={styles.itemContainerStyle}
          selectedItemStyle={styles.selectedStyle}
          iconColor={Constants.black}
        />
        {submitted && !userDetail.looking_for && (
        <Text style={styles.require}>{t("Looking For is required")}</Text>
      )}

      <Text style={styles.label}>{t("Age Range")}</Text>
      <Dropdown
          ref={dropdownRef3}
          data={agelist}
          labelField="label"
          valueField="value"
          placeholder={t("Select age range")}
          value={userDetail?.age_range}
          onChange={item => setUserDetail({...userDetail, age_range: item.value})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, age_range: dditem.value });
                dropdownRef3.current?.close();
              }}>
              <Text style={styles.itemText}>{dditem.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.selectedText}
          itemTextStyle={styles.itemText}
          itemContainerStyle={styles.itemContainerStyle}
          selectedItemStyle={styles.selectedStyle}
          iconColor={Constants.black}
        />

      {submitted && !userDetail.age_range && (
        <Text style={styles.require}>{t("Age Range is required")}</Text>
      )}

      {/* {edit? */}
      <TouchableOpacity style={styles.signInbtn} onPress={() => submit()}>
        <Text style={styles.buttontxt}>{data?.needprofile ? t("Finish & Start Connecting") : t("Update Profile")}</Text>
      </TouchableOpacity>
       {/* :<TouchableOpacity style={styles.signInbtn} onPress={() => setEdit(true)}>
         <Text style={styles.buttontxt}>Edit</Text>
       </TouchableOpacity>} */}

      <CameraGalleryPeacker
        show={showImagePicker}
        title={t("Choose from")}
        getImageValue={getImageValue}
        base64={false}
        cancel={() => setShowImagePicker(false)}
      />

    </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.light_black,
    padding: 20,
  },
  imgpart: {
    height: 120,
    width: 120,
    alignSelf: 'center',
    position: 'relative',
    zIndex: 9,
    marginBottom: 20,
    borderColor:Constants.custom_blue,
    borderRadius:100,
    backgroundColor:Constants.white,
    justifyContent:'center',
    alignItems:'center'
  },
   backcov: {
    height: 30,
    width: 30,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Constants.customgrey4,
  },
  editiconcov: {
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: Constants.custom_blue,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    // marginTop: 115,
    right: -5,
    bottom: 0,
    zIndex: 9,
  },
  logo: {
    height: '100%',
    width: '100%',
    alignSelf: 'center',
    borderRadius: 60,
    // marginTop: 20,
  },
  label: {
    color: Constants.greish_pink,
    fontSize: 14,
    marginVertical: 10,
    fontFamily:FONTS.Medium,
  },
  input: {
    backgroundColor: Constants.light_pink,
    borderWidth: 1.5,
    borderColor: Constants.light_pink2,
    borderRadius: 12,
    height: 55,
    color: Constants.black,
    fontFamily:FONTS.Medium,
    fontSize: 16,
    paddingHorizontal:10,
  },
  input2: {
    backgroundColor: Constants.light_pink,
    borderWidth: 1.5,
    borderColor: Constants.light_pink2,
    borderRadius: 12,
    padding: 15,
    color: Constants.black,
    fontFamily:FONTS.Medium,
    fontSize: 16,
    paddingHorizontal:10,
    lineHeight:25
  },
  signInbtn: {
    height: 50,
    // width: 370,
    borderRadius: 30,
    backgroundColor: Constants.custom_red,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  headtxt: {
    color: Constants.black,
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
  require: {
    color: Constants.red,
    fontFamily: FONTS.Medium,
    marginLeft: 10,
    fontSize: 14,
    marginTop: 10,
  },

  ///dropdown///
  itemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    // width: '100%',
    backgroundColor: Constants.custom_red,
    borderBottomWidth: 1,
    borderColor: Constants.white,
  },
  dropdownContainer: {
    // borderRadius: 12,
    backgroundColor: Constants.custom_red,
  },
  selectedStyle: {
    backgroundColor: Constants.custom_red,
  },
  itemContainerStyle: {
    borderColor: Constants.customgrey,
    backgroundColor: Constants.custom_red,
  },
  placeholder: {
    color: Constants.greish_pink,
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  selectedText: {
    color: Constants.black,
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  itemText: {
    fontSize: 14,
    color: Constants.white,
    fontFamily: FONTS.Medium,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: Constants.light_pink2,
    borderRadius: 10,
    paddingHorizontal: 7,
    backgroundColor: Constants.light_pink,
  },
  frw:{
    flexDirection:'row',
    justifyContent:'space-between',
    flex:1
  }
});
