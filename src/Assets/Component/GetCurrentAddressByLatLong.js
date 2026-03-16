/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import {
  setKey,
  fromLatLng,
} from 'react-geocode';
import { Googlekey } from '../Helpers/constant';

const GetCurrentAddressByLatLong = (props) => {
  console.log(props);
  setKey(Googlekey);
  let address = '';
  return new Promise((resolve, reject) => {
    fromLatLng(props.lat, props.long)
      .then(({ results }) => {
        const { lat, lng } = results[0].geometry.location;
        const l = results.filter(
          (f) =>
            f.geometry.location.lat === props.lat &&
            f.geometry.location.lng === props.long,
        );
        console.log('l----------->', l);
        address = results;
        resolve({ results, latlng: props });
      })
      .catch(console.error);

    return address;
  });
};

export default GetCurrentAddressByLatLong;
