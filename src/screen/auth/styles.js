import { StyleSheet, Dimensions, Platform } from 'react-native';
import Constants, { FONTS } from '../../Assets/Helpers/constant';
import{hp,wp} from '../../../utils/responsiveScreen'
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.light_black,
    // padding: wp(4),
  },
  illustrationContainer: {
    height: '50%',
    width: '100%',
    backgroundColor: '#2a2a2a',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: Constants.white,
    fontFamily: FONTS.Medium,
    marginBottom: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  titleText: {
    fontSize: 28,
    color: Constants.white,
    fontFamily: FONTS.Bold,
  },
  forgtxt:{
    fontSize: 14,
    color: Constants.customgrey3,
    fontFamily: FONTS.Medium,
    marginTop: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  registerButton: {
    backgroundColor: Constants.custom_red,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  registerButton2: {
    backgroundColor: Constants.custom_red,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop:40
  },
  registerButtonText: {
    color: Constants.white,
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
  signInButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Constants.customgrey3,
  },
  mayBeLaterText: {
    color: '#6a6a6a',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },

header: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#111822',
    borderWidth: 1,
    borderColor: '#475467',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer2: {
    height: 280,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 40,
    // backgroundColor:'red'
  },
  formContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  label: {
    color: Constants.customgrey3,
    fontSize: 14,
    marginVertical: 10,
    fontFamily:FONTS.Medium,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    height: 55,
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal:10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    height: 55,
  },
  passwordInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal:10,
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 30,
    marginTop: 10,
  },
  forgotPasswordText: {
    color: Constants.custom_red,
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    color: '#ffffff',
    fontSize: 15,
  },
  logInLink: {
    color: '#c41e3a',
    fontSize: 15,
    fontWeight: '600',
  },
  textcov:{
    // marginTop:hp(7),
    alignSelf:'center',
    position:'absolute',
    bottom:20
  },
  lasttxt:{
    fontSize:wp(3.5),
    fontFamily:FONTS.SemiBold,
    color:Constants.white
  },
  require: {
    color: Constants.red,
    fontFamily: FONTS.Medium,
    marginLeft: wp(2),
    marginTop: hp(0.7),
    fontSize: wp(3.5),
    alignSelf:'flex-start'
    // marginTop:10
  },
  checkboxContainer:{
    flexDirection:'row',
    alignItems:'center',
    marginTop:20,
     gap:10
  },
  pritermtxt:{
    color:Constants.customgrey6,
    fontSize:12,
    fontFamily:FONTS.Medium,
    width:'90%'
  },
  pritxtbol:{
    color:Constants.white,
    fontSize:12,
    fontFamily:FONTS.Bold,
  },
  forimg:{
    width:wp(50),
    height:hp(25),
    alignSelf:'center'
  }
})

export default styles;
