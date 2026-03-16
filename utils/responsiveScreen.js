// packages
import {Dimensions, PixelRatio} from 'react-native';

const {height: screenHeight, width: screenWidth} = Dimensions.get('window');

const wp = (value) => {
  return PixelRatio.roundToNearestPixel((screenWidth * value) / 100);
};
const hp = (value) => {
  return PixelRatio.roundToNearestPixel((screenHeight * value) / 100);
};

export {wp, hp};
