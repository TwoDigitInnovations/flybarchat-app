import Toast from 'react-native-toast-message';

export function showToaster(type,message) {
  Toast.show({
          type: type,
          text1: message,
          position: 'top',
          visibilityTime: 2500,
          autoHide: true,
          onHide: () => {
            // setToast('');
          },
        });
}
