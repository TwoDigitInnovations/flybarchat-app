// const prodUrl = 'http://192.168.0.207:8001/';
//  const prodUrl = 'http://10.112.185.202:8001/';
const prodUrl = 'https://api.flaychatbar.com/';
// const prodUrl = 'http://10.113.109.141:8001/';

let apiUrl = prodUrl;
export const Googlekey = ''
export const Currency = '$'

const Constants = {
  baseUrl: apiUrl,
  red: '#FF0000',
  light_red: '#462128',
  customgrey: '#252b2b',
  black: '#000000',
  light_black: '#11141A',
  custom_red: '#980008',
  white: '#FFFFFF',
  tabgrey: '#8B8B8B',
  customgrey2: '#A4A4A4',
  customgrey3: '#858080',
  customgrey4: '#F1F1F1',
  customgrey5: '#dedede',
  customgrey6: '#BFBFBF',
  custom_yellow: '#FFCC00',
  light_yellow: '#F9F7ED',
  light_blue2: '#cae8f1',
  light_blue3: '#eaf8ff',
  light_blue: '#74d7fa',

  

  numberValidationRegx: /^\d+$/,
  passwordValidation: /^(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/,


};
 export const checkEmail = (emailval) => {
  const reg =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  let isvalid = reg.test(emailval);
  return isvalid;
};
export const FONTS = {
  Regular: 'Inter_18pt-Regular',
  Bold: 'Inter_18pt-Bold',
  Medium: 'Inter_18pt-Medium',
  SemiBold: 'Inter_18pt-SemiBold',
  Heavy: 'Inter_18pt-ExtraBold',
};


export default Constants;
