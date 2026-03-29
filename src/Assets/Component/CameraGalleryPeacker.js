import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { check, PERMISSIONS, RESULTS, request, requestMultiple } from 'react-native-permissions';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { CameraIcon,CrossIcon,ImageIcon } from '../theme';
import Constants, { FONTS } from '../Helpers/constant';
import { useTranslation } from 'react-i18next';

const CameraGalleryPeacker = (props) => {
  const { t } = useTranslation();
  console.log('props',props)
  const options2 = {
    mediaType: 'photo',
    maxWidth: props?.width || 300,
    maxHeight: props?.height || 300,
    quality: props?.quality || 1,
    includeBase64: props.base64,
    saveToPhotos: true
    // cameraType: props?.useFrontCamera ? 'front' : 'back',
  };

  const launchCameras = async () => {
    launchCamera(options2, (response) => {
      console.log(response)
      if (response.didCancel) {
        props?.cancel()
        console.log('User cancelled image picker');
      } else if (response.error) {
        props?.cancel()
        console.log('ImagePicker Error:', response.error);
        // setErrorMessage('Error selecting image. Please try again.');
      } else if (response.customButton) {
        props?.cancel()
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const source = { uri: response.uri };
        onCancel()
        // props.getImageValue(response);
        props.getImageValue({
          uri: response.assets[0].uri,
      type: response.assets[0].type,
      name: response.assets[0].fileName
        });
      }
    });

  };

  const launchImageLibrarys = async () => {

    launchImageLibrary(options2, (response) => {
      if (response.didCancel) {
        props?.cancel()
        console.log('User cancelled image picker');
      } else if (response.error) {
        props?.cancel()
        console.log('ImagePicker Error:', response.error);
        // setErrorMessage('Error selecting image. Please try again.');
      } else if (response.customButton) {
        props?.cancel()
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const source = { uri: response.uri };
      // setTimeout(() => {
        onCancel()
      // }, 100);
        // props.getImageValue(response);
        props.getImageValue({
          uri: response.assets[0].uri,
      type: response.assets[0].type,
      name: response.assets[0].fileName
        });
      }
    });
  };

  const requestMediaPermission = async (type, permission) => {
  try {
    const result = await check(permission);

    if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
      type();
      return;
    }

    const permissionResult = await request(permission);

    if (permissionResult === RESULTS.GRANTED || permissionResult === RESULTS.LIMITED) {
      type();
    } else {
      console.log('Permission denied');
    }

  } catch (error) {
    console.error('Permission error:', error);
  }
};



  const onCancel = () => {
    if (props?.cancel !== undefined) {
      props?.cancel();
    }
  };

  return (
    <Modal
        visible={props?.show}
        transparent={true}
        style={styles.modal}
        onRequestClose={onCancel}>
        <View style={styles.container}>
         <View style={styles.cardView}>
         <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%',padding:15}}>
         <View style={{width:30}}></View>
            <Text style={styles.title}>{props?.title ? props?.title : 'Choose Option'}</Text>
                        <TouchableOpacity style={styles.crossBtn} onPress={onCancel}>
              <CrossIcon height={25} width={25} color={Constants.white}/>
            </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <TouchableOpacity onPress={()=>Platform.OS === 'ios' ? requestMediaPermission(launchCameras, PERMISSIONS.IOS.CAMERA) : launchCameras()} style={styles.smallCard}>
                <CameraIcon height={30} width={30} color={Constants.white}/>
                <Text style={[styles.optionTxt,{marginTop:6}]}>{t("Camera")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={()=>Platform.OS === 'ios' ? requestMediaPermission(launchImageLibrarys, PERMISSIONS.IOS.PHOTO_LIBRARY) : launchImageLibrarys()}
                style={styles.smallCard}>
                <ImageIcon height={23} width={23} color={Constants.white}/>
                <Text style={styles.optionTxt}>{t("Gallery")}</Text>
              </TouchableOpacity>
            </View>


          </View>
        </View>
      </Modal>
  );
};

export default CameraGalleryPeacker;
const styles = StyleSheet.create({
    modal: {
    flex: 1,
  },
  container: {
    flex: 1,
    // backgroundColor: Constants.white,
    justifyContent: 'flex-end',
  },
  container2: {
    flex: 1,
    backgroundColor: Constants.red,
    justifyContent: 'center',
  },
  cardView: {
    backgroundColor: Constants.light_black,
    alignItems: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  title: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
  title2: {
    color: Constants.white,
    fontSize: 14,
    fontFamily: FONTS.RobotoMedium,
  },
  crossBtn: {
    alignSelf: 'center',
  },
  btnWraper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:50,
    marginBottom:30
  },
  smallCard: {
    height: 100,
    width: 100,
    backgroundColor: Constants.customgrey,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  optionTxt: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.Medium,
    marginTop:10
  },
})
