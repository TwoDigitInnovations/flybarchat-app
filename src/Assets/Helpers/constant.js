// const prodUrl = 'http://192.168.0.215:8001/';
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
  SURFACE: '#1C1E23',
  BORDER: '#2A2D35',
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

export const LANGUAGES = [
  { name: 'English', native: 'English', code: 'en', flag: '🇺🇸' },
  // { name: 'Italian', native: 'Italiano', code: 'it', flag: '🇮🇹' },
  { name: 'Spanish', native: 'Español', code: 'es', flag: '🇪🇸' },
  { name: 'French', native: 'Français', code: 'fr', flag: '🇫🇷' },
  { name: 'German', native: 'Deutsch', code: 'de', flag: '🇩🇪' },
  { name: 'Russian', native: 'Русский', code: 'ru', flag: '🇷🇺' },
  { name: 'Portuguese', native: 'Português', code: 'pt', flag: '🇵🇹' },
  { name: 'Arabic', native: 'العربية', code: 'ar', flag: '🇸🇦' },
  { name: 'Hindi', native: 'हिंदी', code: 'hi', flag: '🇮🇳' },
  { name: 'Sinhala', native: 'සිංහල', code: 'si', flag: '🇱🇰' },
  { name: 'Tamil', native: 'தமிழ்', code: 'ta', flag: '🇮🇳' },
  { name: 'Romanian', native: 'Română', code: 'ro', flag: '🇷🇴' },
  { name: 'Ukrainian', native: 'Українська', code: 'uk', flag: '🇺🇦' },
  { name: 'Polish', native: 'Polski', code: 'pl', flag: '🇵🇱' },
  { name: 'Bulgarian', native: 'Български', code: 'bg', flag: '🇧🇬' },
];

export const getZodiacSign = (day, month) => {
  if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Aries";
  if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Taurus";
  if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Gemini";
  if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Cancer";
  if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Leo";
  if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Virgo";
  if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Libra";
  if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Scorpio";
  if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Sagittarius";
  if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "Capricorn";
  if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Aquarius";
  if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "Pisces";
};


export default Constants;
