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
} from 'react-native';
import {createRef, useEffect, useRef, useState} from 'react';
import Constants, {checkEmail, FONTS} from '../../Assets/Helpers/constant';
import CameraGalleryPeacker from '../../Assets/Component/CameraGalleryPeacker';
import { goBack, reset } from '../../../utils/navigationRef';
import { getProfile, updateProfile } from '../../../redux/auth/authAction';
import { useDispatch } from 'react-redux';
import { showToaster } from '../../../utils/toaster';
import {CameraIcon} from '../../Assets/theme';
import { Dropdown } from 'react-native-element-dropdown';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker'

const Profile = (props) => {
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

   const genderlist = [
    { label: 'Men', value: 'Men' },
    { label: 'Women', value: 'Women' },
    { label: 'Other', value: 'Other' },
  ];

   const agelist = [
    { label: '18-25', value: '18-25' },
    { label: '26-44', value: '26-44' },
    { label: '45-over', value: '45-over' },
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
      !userDetail?.city||!userDetail?.gender||!userDetail?.looking_for||!userDetail?.age_range
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
    <View style={{flex:1}}>
    <ScrollView
      style={[styles.container]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always">
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
       {/* <TouchableOpacity style={styles.backcov} onPress={() => goBack()}>
               <BackIcon  />
                 </TouchableOpacity> */}
        <Text style={styles.headtxt}>Personal Data</Text>
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

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          // editable={edit}
          placeholder="Enter Name"
          value={userDetail?.name}
          onChangeText={name => setUserDetail({...userDetail, name})}
          placeholderTextColor={Constants.customgrey2}
        />
      {submitted && !userDetail.name && (
        <Text style={styles.require}>Name is required</Text>
      )}
      <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          // editable={edit}
          placeholder="Enter Email"
          value={userDetail?.email}
          onChangeText={email => setUserDetail({...userDetail, email})}
          placeholderTextColor={Constants.customgrey2}
        />
        {submitted && !userDetail.email && (
        <Text style={styles.require}>Email is required</Text>
      )}

      <Text style={styles.label}>Gender</Text>
      <Dropdown
          ref={dropdownRef}
          data={genderlist}
          labelField="label"
          valueField="label"
          placeholder="Select gender"
          value={userDetail?.gender}
          onChange={item => setUserDetail({...userDetail, gender: item.label})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, gender: dditem.label });
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
        />

        {submitted && !userDetail.gender && (
        <Text style={styles.require}>Gender is required</Text>
      )}

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          // editable={edit}
          placeholder="Enter Number"
          value={userDetail?.phone}
          onChangeText={phone => setUserDetail({...userDetail, phone})}
          placeholderTextColor={Constants.customgrey2}
        />
      {submitted && !userDetail.phone && (
        <Text style={styles.require}>Number is required</Text>
      )}
        <Text style={styles.label}>Date of Birth</Text>
        <Text style={[styles.input2,{color:userDetail?.dob?Constants.white:Constants.customgrey2}]} onPress={() => setDateModel(true)}>{userDetail?.dob ? moment(userDetail?.dob).format('DD MMM YYYY') : "Schedule Date"}</Text>
      {submitted && !userDetail.dob && (
        <Text style={styles.require}>Date of Birth is required</Text>
      )}
      {dateModel&&<DateTimePicker
        mode='date'
        textColor='black'
        // minimumDate={new Date()}
        value={userDetail?.dob?new Date(userDetail?.dob):new Date()}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={onDateChange}
      />}

      <View style={{flexDirection:'row',justifyContent:'space-between',flex:1}}>
        <View style={{flex:1,marginRight:15}}>
            <Text style={styles.label}>Country</Text>
        <TextInput
          style={[styles.input,{flex:1}]}
          // editable={edit}
          placeholder="Enter Country"
          value={userDetail?.country}
          onChangeText={country => setUserDetail({...userDetail, country})}
          placeholderTextColor={Constants.customgrey2}
        />
      {submitted && !userDetail.country && (
        <Text style={styles.require}>Country is required</Text>
      )}
        </View>
        <View style={{flex:1}}>
            <Text style={styles.label}>City</Text>
        <TextInput
          style={[styles.input,{flex:1}]}
          // editable={edit}
          placeholder="Enter City"
          value={userDetail?.city}

          onChangeText={city => setUserDetail({...userDetail, city})}
          placeholderTextColor={Constants.customgrey2}
        />
      {submitted && !userDetail.city && (
        <Text style={styles.require}>City is required</Text>
      )}
        </View>
      </View>

      <Text style={styles.label}>Looking For</Text>
      <Dropdown
          ref={dropdownRef2}
          data={genderlist}
          labelField="label"
          valueField="label"
          placeholder="Select gender"
          value={userDetail?.looking_for}
          onChange={item => setUserDetail({...userDetail, looking_for: item.label})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, looking_for: dditem.label });
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
        />
        {submitted && !userDetail.looking_for && (
        <Text style={styles.require}>Looking For is required</Text>
      )}

      <Text style={styles.label}>Age Range</Text>
      <Dropdown
          ref={dropdownRef3}
          data={agelist}
          labelField="label"
          valueField="label"
          placeholder="Select age range"
          value={userDetail?.age_range}
          onChange={item => setUserDetail({...userDetail, age_range: item.label})}
          renderItem={dditem => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => {
                setUserDetail({ ...userDetail, age_range: dditem.label });
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
        />

      {submitted && !userDetail.age_range && (
        <Text style={styles.require}>Age Range is required</Text>
      )}

      {/* {edit? */}
      <TouchableOpacity style={styles.signInbtn} onPress={() => submit()}>
        <Text style={styles.buttontxt}>{data?.needprofile ? "Finish & Start Connecting" : "Update Profile"}</Text>
      </TouchableOpacity>
       {/* :<TouchableOpacity style={styles.signInbtn} onPress={() => setEdit(true)}>
         <Text style={styles.buttontxt}>Edit</Text>
       </TouchableOpacity>} */}

      <CameraGalleryPeacker
        show={showImagePicker}
        title="Choose from"
        getImageValue={getImageValue}
        base64={false}
        cancel={() => setShowImagePicker(false)}
      />

    </ScrollView>
    </View>
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
    color: Constants.customgrey3,
    fontSize: 14,
    marginVertical: 10,
    fontFamily:FONTS.Medium,
  },
  input: {
    backgroundColor: '#111822',
    borderWidth: 1.5,
    borderColor: '#475467',
    borderRadius: 12,
    height: 55,
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal:10,
  },
  input2: {
    backgroundColor: '#111822',
    borderWidth: 1.5,
    borderColor: '#475467',
    borderRadius: 12,
    padding: 15,
    color: '#ffffff',
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
    color: Constants.white,
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
    borderRadius: 12,
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
    color: Constants.customgrey2,
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  selectedText: {
    color: Constants.white,
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
    borderColor: '#475467',
    borderRadius: 10,
    paddingHorizontal: 7,
    backgroundColor: '#111822',
  },
});
