import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import React, { useState } from 'react';
import styles from './styles';
import Constants from '../../Assets/Helpers/constant';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';
import {
  resetPassword,
  sendOtp,
  verifyOtp,
} from '../../../redux/auth/authAction';
import { goBack } from '../../../utils/navigationRef';
import { BackIcon } from '../../Assets/theme';

const ForgotPassword = () => {
  const [showPass, setShowPass] = useState(true);
  const [showConfPass, setShowConfPass] = useState(true);
  const [token, setToken] = useState('');
  const [step, setStep] = useState(0);
  const dispatch = useDispatch();
  const validationEmailSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
  });
  const validationOtpSchema = Yup.object().shape({
    otp: Yup.number().required('Otp is required'),
  });
  const validationPasswordSchema = Yup.object().shape({
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    conformpassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm Password is required'),
  });

  const formikEmail = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: validationEmailSchema,
    onSubmit: (values, assets) => {
      sendOtpApi(values, assets);
    },
  });

  const formikOtp = useFormik({
    initialValues: {
      otp: '',
    },
    validationSchema: validationOtpSchema,
    onSubmit: (values, assets) => {
      verifyOtpApi(values, assets);
    },
  });

  const formikPassword = useFormik({
    initialValues: {
      conformpassword: '',
      password: '',
    },
    validationSchema: validationPasswordSchema,
    onSubmit: (values, assets) => {
      changePassword(values, assets);
    },
  });

  const sendOtpApi = async (value, { resetForm }) => {
    dispatch(sendOtp(value))
      .unwrap()
      .then(data => {
        console.log('data', data);
        resetForm();
        setToken(data.token);
        setStep(1);
      })
      .catch(error => {
        console.error('SendOtp failed:', error);
      });
  };

  const verifyOtpApi = async (value, { resetForm }) => {
    const data = {
      otp: value.otp,
      token
    }
    dispatch(verifyOtp(data))
      .unwrap()
      .then(data => {
        console.log('data', data);
        resetForm();
        setToken(data.token);
        setStep(2);
      })
      .catch(error => {
        console.error('VerifyOtp failed:', error);
      });
  };

  const changePassword = async (value, { resetForm }) => {
    dispatch(resetPassword({...value,token}))
      .unwrap()
      .then(data => {
        console.log('data', data);
        resetForm();
        setToken('');
        setStep(0);
      })
      .catch(error => {
        console.error('ChangePassword failed:', error);
      });
  };
  return (
          <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.container,{padding:20}]}>
        <View style={styles.buttompart}>
          <TouchableOpacity
          style={styles.backButton}
          onPress={() => goBack()}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false} >
          <Text style={[styles.titleText,{marginTop:20}]}>
            {step === 0
              ? 'Forgot Password?'
              : step === 1
              ? 'Verify Your Number'
              : 'Change Password'}
          </Text>
          <Text style={styles.forgtxt}>
            {step === 0
              ? 'Enter your registered e-mail ID to receive the OTP to change your password.'
              : step === 1
              ? 'Enter the one-time password received on your number'
              : 'Your password must be at least 8 characters long and include one uppercase letter and one number.'}
          </Text>
          <Image
            source={
                 require('../../Assets/Images/forget.png') }
            style={styles.forimg}
            resizeMode='contain'
          />
          {step === 0 && (
            <View>
              <View style={styles.inpcov2}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Email"
                  textAlign="left"
                  placeholderTextColor={Constants.customgrey2}
                  value={formikEmail.values.email}
                  onChangeText={formikEmail.handleChange('email')}
                  onBlur={formikEmail.handleBlur('email')}
                />
              </View>
              {formikEmail.touched.email && formikEmail.errors.email && (
                <Text style={styles.require}>{formikEmail.errors.email}</Text>
              )}
            </View>
          )}
          {step === 1 && (
            <View>
              <View style={styles.inpcov2}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor={Constants.customgrey2}
                  value={formikOtp.values.otp}
                  onChangeText={formikOtp.handleChange('otp')}
                  onBlur={formikOtp.handleBlur('otp')}
                />
              </View>
              {formikOtp.touched.otp && formikOtp.errors.otp && (
                <Text style={styles.require}>{formikOtp.errors.otp}</Text>
              )}
            </View>
          )}
          {step === 2 && (
            <View>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter Password"
                  secureTextEntry={showPass}
                  placeholderTextColor={Constants.customgrey2}
                  value={formikPassword.values.password}
                  onChangeText={formikPassword.handleChange('password')}
                  onBlur={formikPassword.handleBlur('password')}
                />

                <TouchableOpacity
                  onPress={() => {
                    setShowPass(!showPass);}}
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
              {formikPassword.touched.password &&
                formikPassword.errors.password && (
                  <Text style={styles.require}>
                    {formikPassword.errors.password}
                  </Text>
                )}
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter Confirm Password"
                  secureTextEntry={showConfPass}
                  placeholderTextColor={Constants.customgrey2}
                  value={formikPassword.values.conformpassword}
                  onChangeText={formikPassword.handleChange('conformpassword')}
                  onBlur={formikPassword.handleBlur('conformpassword')}
                />

                <TouchableOpacity
                  onPress={() => {
                    setShowConfPass(!showConfPass);
                  }}
                  style={styles.eyeIcon}
                >
                  <Image
                    source={
                      showConfPass
                        ? require('../../Assets/Images/eye-1.png')
                        : require('../../Assets/Images/eye.png')
                    }
                    style={{ height: 28, width: 28 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              {formikPassword.touched.conformpassword &&
                formikPassword.errors.conformpassword && (
                  <Text style={styles.require}>
                    {formikPassword.errors.conformpassword}
                  </Text>
                )}
            </View>
          )}
          {step === 0 && (
            <TouchableOpacity
              style={styles.registerButton2}
              onPress={formikEmail.handleSubmit}
            >
              <Text style={styles.registerButtonText}>Send OTP</Text>
            </TouchableOpacity>
          )}
          {step === 1 && (
            <TouchableOpacity
              style={styles.registerButton2}
              onPress={formikOtp.handleSubmit}
            >
              <Text style={styles.registerButtonText}>Verify OTP</Text>
            </TouchableOpacity>
          )}
          {step === 2 && (
            <TouchableOpacity
              style={styles.registerButton2}
              onPress={formikPassword.handleSubmit}
            >
              <Text style={styles.registerButtonText}>Submit</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
