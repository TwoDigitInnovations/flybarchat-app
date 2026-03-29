import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import styles from './styles';
import { goBack, navigate, reset } from '../../../utils/navigationRef';
import Constants from '../../Assets/Helpers/constant';
import * as Yup from 'yup';
import { Formik, useFormik } from 'formik';
// import { OneSignal } from 'react-native-onesignal';
import { useDispatch } from 'react-redux';
import { login } from '../../../redux/auth/authAction';
import { BackIcon } from '../../Assets/theme';
import { useTranslation } from 'react-i18next';

const SignIn = () => {
  const [showPass, setShowPass] = useState(true);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const validationSchema = Yup.object().shape({
    email: Yup.string().email(t('Invalid email')).required(t('Email is required')),
    password: Yup.string()
      .min(8, t('Password must be at least 8 characters'))
      .required(t('Password is required')),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values, assets) => {
      submit(values, assets);
    },
  });

  const submit = async (value, { resetForm }) => {
    console.log('enter');
    // const player_id = await OneSignal.User.pushSubscription.getIdAsync()
    // const device_token = await OneSignal.User.pushSubscription.getTokenAsync()

    //     value.player_id= player_id
    //     value.device_token =device_token,

    dispatch(login(value))
      .unwrap()
      .then(data => {
        console.log('data', data);
        resetForm();
      })
      .catch(error => {
        console.error('Signin failed:', error);
      });
  };
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goBack()}
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
<KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{flex:1}}
            >
<ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.illustrationContainer2}>
        <Image
          source={require('../../Assets/Images/login.png')} // You'll need to add this image
          style={styles.illustration}
          resizeMode="stretch"
        />
      </View>

      <View style={styles.formContainer}>
        {/* Email Input */}
          <Text style={styles.label}>{t("Email")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("Enter Email")}
            textAlign="left"
            placeholderTextColor={Constants.customgrey2}
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            onBlur={formik.handleBlur('email')}
          />
        {formik.touched.email && formik.errors.email && (
          <Text style={styles.require}>{formik.errors.email}</Text>
        )}

          <Text style={styles.label}>{t("Password")}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t("Enter Password")}
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
              style={styles.eyeIcon}
            >
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
          {formik.touched.password && formik.errors.password && (
            <Text style={styles.require}>{formik.errors.password}</Text>
          )}
          <TouchableOpacity style={styles.forgotPasswordContainer} onPress={()=>navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>{t("Forgot password?")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={formik.handleSubmit}
          >
            <Text style={styles.registerButtonText}>{t("Login")}</Text>
          </TouchableOpacity>

      </View>
      </ScrollView>
          {!keyboardVisible && (
            <Text style={styles.textcov} onPress={() => navigate('SignUp')}>
              <Text style={styles.lasttxt}>{t("Don’t have an account ?")} </Text>
              <Text
                style={[
                  styles.lasttxt,
                  { color: Constants.custom_red, textDecorationLine: 'underline' },
                ]}
              >
                {t("Sign Up")}
              </Text>
            </Text>
          )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignIn;
