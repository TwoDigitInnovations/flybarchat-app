import { Animated, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import styles from './styles';
import * as Yup from 'yup';
import { Formik, useFormik } from 'formik';
import Constants from '../../Assets/Helpers/constant';
import { signup } from '../../../redux/auth/authAction';
import { useDispatch } from 'react-redux';
import { goBack, navigate } from '../../../utils/navigationRef';
import { BackIcon, CheckboxIcon } from '../../Assets/theme';

const SignUp = () => {
  const [showPass, setShowPass] = useState(true);
  const dispatch = useDispatch();
    const validationSchema = Yup.object().shape({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email').required('Email is required'),
      password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
      // conformpassword: Yup.string()
      //       .oneOf([Yup.ref('password')], 'Passwords must match')
      //       .required('Confirm Password is required'),
    });
  
    const formik = useFormik({
      initialValues: {
        name: '',
        email: '',
        password: '',
        // conformpassword:'',
      },
      validationSchema: validationSchema,
      onSubmit: (values, assets) => {
        submit(values, assets)
      },
    });
  
   const submit = async (value, { resetForm }) => {
  
      dispatch(signup({ ...value, role: tabopt === 1 ? 'company' : 'user' }))
        .unwrap()
        .then(data => {
          console.log('data', data);
          resetForm();
          navigate('SignIn');
        })
        .catch(error => {
          console.error('Signin failed:', error);
        });
    };
    const [tabopt, settabopt] = useState(0);
  const toggleAnim = useRef(new Animated.Value(tabopt)).current;
  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: tabopt,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [tabopt]);

  const translateX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
    useEffect(() => {
      const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboardVisible(true);
      });
      const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardVisible(false);
      });
  
      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }, []);

  return (
      <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.container,{padding:20}]}
            >

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goBack()}
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.titleText,{marginTop:20}]}>Get started</Text>

            <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Full Name"
                textAlign='left'
                placeholderTextColor={Constants.customgrey2}
                value={formik.values.name}
                onChangeText={formik.handleChange('name')}
                onBlur={formik.handleBlur('name')}
              />
            {formik.touched.name && formik.errors.name &&
              <Text style={styles.require}>{formik.errors.name}</Text>
            }
            <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Email"
                textAlign='left'
                placeholderTextColor={Constants.customgrey2}
                value={formik.values.email}
                onChangeText={formik.handleChange('email')}
                onBlur={formik.handleBlur('email')}
              />
            {formik.touched.email && formik.errors.email &&
              <Text style={styles.require}>{formik.errors.email}</Text>
            }

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
                placeholder="Enter Password"
                secureTextEntry={showPass}
                placeholderTextColor={Constants.customgrey2}
                value={formik.values.password}
                onChangeText={formik.handleChange('password')}
                onBlur={formik.handleBlur('password')}
              />
    
              <TouchableOpacity
                onPress={() => {
                  setShowPass(!showPass);
                }}
                style={styles.eyeIcon}>
                <Image
                  source={
                    showPass
                      ? require('../../Assets/Images/eye-1.png')
                      : require('../../Assets/Images/eye.png')
                  }
                  style={{ height: 28, width: 28 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            {formik.touched.password && formik.errors.password &&
              <Text style={styles.require}>{formik.errors.password}</Text>
            }
            {/* <Text style={styles.inptxt}>Confirm Password</Text>
            <View style={styles.inpcov}>
              <TextInput
                style={styles.inputfield}
                placeholder="Enter Confirm Password"
                secureTextEntry={showPass}
                placeholderTextColor={Constants.customgrey2}
                value={formik.values.conformpassword}
                onChangeText={formik.handleChange('conformpassword')}
                onBlur={formik.handleBlur('conformpassword')}
              />
    
              <TouchableOpacity
                onPress={() => {
                  setShowPass(!showPass);
                }}
                style={[styles.iconView, { borderRightWidth: 0 }]}>
                <Image
                  source={
                    showPass
                      ? require('../../Assets/Images/eye-1.png')
                      : require('../../Assets/Images/eye.png')
                  }
                  style={{ height: 28, width: 28 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            {formik.touched.conformpassword && formik.errors.conformpassword &&
              <Text style={styles.require}>{formik.errors.conformpassword}</Text>
            } */}
    
          <View style={styles.checkboxContainer}>
            <CheckboxIcon width={24} height={24} />
                <Text style={styles.pritermtxt} >
                  <Text>By signing up for the Flay Chat Bar, you agree to the </Text>
                  <Text style={styles.pritxtbol}>Term of service</Text>
                  <Text > and </Text>
                  <Text style={styles.pritxtbol}>Privacy Policy</Text>
                </Text>
          </View>
                <TouchableOpacity style={styles.registerButton2} onPress={formik.handleSubmit}>
                  <Text style={styles.registerButtonText}>Sign up</Text>
                </TouchableOpacity>
    
          </ScrollView>
                {!keyboardVisible &&<Text style={styles.textcov} onPress={()=>navigate('SignIn')}>
                  <Text style={styles.lasttxt}>Already have an account?</Text>
                  <Text style={[styles.lasttxt,{color:Constants.custom_red,textDecorationLine:'underline'}]}>Sign In</Text>
                </Text>}
          </KeyboardAvoidingView>
  )
}

export default SignUp
