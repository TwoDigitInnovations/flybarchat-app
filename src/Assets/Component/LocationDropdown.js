import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PermissionsAndroid,
  Image,
  TextInput,
  Platform,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useEffect, useRef, memo, useMemo, useCallback, } from 'react';
import Geocode, { fromAddress, setDefaults, setKey } from 'react-geocode';
import Constants, { FONTS, Googlekey } from '../Helpers/constant';
import axios from 'axios';
import {
  request,
  PERMISSIONS,
  requestLocationAccuracy,
} from 'react-native-permissions';
import { debounce } from 'lodash'
import { useDispatch } from 'react-redux';
import { setEnteredAddress, setEnteredLocation } from '../../../redux/location/locationSlice';


const LocationDropdown = (props) => {
  const [showList, setShowList] = useState(false);
  const [userSelected, setUserSelected] = useState(false);
  const [prediction, setPredictions] = useState([]);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState({});
  const refInput = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    setAddress(props.value);
  }, [props.value]);

  useEffect(() => {
    if (props?.focus) {
      console.log(props?.focus);
      refInput.current.focus();
    } else {
      // refInput.current?.blur();
    }
  }, [props]);
  // console.log('prediction',prediction)
  // prediction.map((ite)=>console.log('dropdata',item?.description))
  // console.log('location', location);
  // console.log('shoshowList',showList);


  const GOOGLE_PACES_API_BASE_URL =
    'https://maps.googleapis.com/maps/api/place';

  const GooglePlacesInput = async (text) => {
    if (!text) {
      setPredictions([]);
      return;
    }
    const apiUrl = `${GOOGLE_PACES_API_BASE_URL}/autocomplete/json?key=${Googlekey}&input=${text}`;
    //&components=country:ec
    try {
      if (Platform.OS === 'ios') {
        request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(async result => {
          console.log(result);
          if (result === 'granted') {
            if (!userSelected) {
             setShowList(true);
             }
            const result = await axios.request({
              method: 'post',
              url: apiUrl,
            });
            if (result) {
              const {
                data: { predictions },
              } = result;
              setPredictions(predictions);
              if (!userSelected) {
             setShowList(true);
             }
            }
          } else {
            // getLocation();
          }
        });
      } else {
        const check = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (check) {
          if (!userSelected) {
             setShowList(true);
             }
          const result = await axios.request({
            method: 'post',
            url: apiUrl,
          });
          if (result) {
            const {
              data: { predictions },
            } = result;
            console.log(result)
            setPredictions(predictions);
            if (!userSelected) {
             setShowList(true);
             }
          }
        } else {
          // getLocation();
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const checkLocation = async (add) => {
    console.log('add===>', add);
    try {
      setKey(Googlekey);
      // setDefaults({
      //   key: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Your API key here.
      //   language: "en", // Default language for responses.
      //   region: "es", // Default region for responses.
      // });
      if (add) {
        fromAddress(add).then(
          (response) => {
            console.log('response==>', response);
            const lat = response.results[0].geometry.location;
            setLocation(lat);
            // props.getLocationVaue(lat, add);
            dispatch(setEnteredLocation({
                lat: lat?.lat,
                long: lat?.lng,
              }));
            dispatch(setEnteredAddress(add));
          },
          (error) => {
            console.error(error);
          },
        );
      }
    } catch (error) {
      console.log(error);
    }
  };
  const debouncelocationdata = useMemo(() => debounce(GooglePlacesInput, 200), [])
  const handlsearch = useCallback((text) => {
    setAddress(text);
    debouncelocationdata(text)
  }, [debouncelocationdata])
  return (
    <View style={{flex:1}}>
      <View
        style={{
          flexDirection: 'row',
          flex:1
        }}>
        <View
          style={[
            styles.amountTimeMainView,
          ]}>
          <View style={{ flex: 1 }}>
            <TextInput
              value={address}
              ref={refInput}
              placeholder={props?.placeholder || 'Select Address'}
              placeholderTextColor={ Constants.customgrey}
              numberOfLines={5}
              style={[styles.amountTime, styles.editjobinput]}
              onBlur={() => {
                if( props.setIsFocus){
                props.setIsFocus(false);
                }
                setShowList(false);
              }}
              onFocus={() => {
                if( props.setIsFocus){
                  props.setIsFocus(props.focus);
                }
              }}
              onChangeText={location => {
                setUserSelected(false);
                // GooglePlacesInput(location);
                handlsearch(location)
                // setAddress(location);
              }}
            />
          </View>
        </View>
      </View>
      {prediction?.length>0 && showList && (
        <View style={styles.list}>
          {prediction.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                borderBottomWidth: prediction?.length===index+1?0:1,
                borderBottomColor: Constants.customgrey2,
                backgroundColor:Constants.customgrey4
              }}
              onPress={() => {
                setShowList(false);
                setUserSelected(true);
                  console.log('pressed')
                  console.log('item==>', item);
                  console.log('itemdec==>', item.description);
                  refInput.current?.blur();
                  setAddress(item?.description);
                  checkLocation(item?.description);
                  if(props.setIsFocus){
                        setTimeout(() => {
                    props.setIsFocus(false)
                  }, 300)
                  }
                }}>
              <Text
                style={styles.item}
                >
                {item?.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  editjobinput: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    margin: 0,
    // lineHeight: 12,
    marginLeft: 2,
    width: '90%',
  },
  amountTimeMainView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  amountTime: {
    color: Constants.black,
    fontSize: 16,
    marginLeft: 5,
    fontFamily:FONTS.Medium
  },
  list: {
    marginVertical: 10,
    position: 'absolute',
    top: 50,
    // left:2,
    width: '99%',
    borderColor: Constants.customgrey2,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: Constants.customgrey4,
    zIndex: 10,
    boxShadow:'2px 2px 6px 0.05px grey',
    padding:2,
  },
  item: {
    fontSize: 14,
    paddingVertical:5,
    marginHorizontal:10,
    marginVertical: 6,
    width: Dimensions.get('window').width - 100,
    flexWrap: 'wrap',
    zIndex: 30,
    flex: 1,
    color: Constants.black,
    fontFamily:FONTS.Medium
  },
});

export default memo(LocationDropdown);
