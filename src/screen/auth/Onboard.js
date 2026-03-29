import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native'
import styles from './styles';
import { MocktailIcon } from '../../Assets/theme';
import { navigate } from '../../../utils/navigationRef';
import { useTranslation } from 'react-i18next';

const Onboard = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      {/* Bar Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../Assets/Images/barImg.png')}
          style={styles.illustration}
          resizeMode="cover"
        />
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>{t("Welcome to the")}</Text>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{t("FLAY CHAT BAR")} </Text>
          <MocktailIcon width={35} height={35} />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.registerButton} onPress={()=>navigate('SignUp')}>
            <Text style={styles.registerButtonText}>{t("Register")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInButton} onPress={()=>navigate('SignIn')}>
            <Text style={styles.registerButtonText}>{t("Sign In")}</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity onPress={()=>navigate('App')}>
            <Text style={styles.mayBeLaterText}>May be later</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  )
}

export default Onboard
