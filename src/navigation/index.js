import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignIn from '../screen/auth/SignIn';
import Onboard from '../screen/auth/Onboard';
import SignUp from '../screen/auth/SignUp';
import ForgotPassword from '../screen/auth/ForgotPassword';
import ChatDetail from '../screen/app/ChatDetail';
import Profile from '../screen/app/Profile';
import Menu from '../screen/app/Menu';
import Music from '../screen/app/Music';
import Banner from '../screen/app/Banner';
import { navigationRef } from '../../utils/navigationRef';
import {TabNav} from './TabNavigation';
import VideoCallScreen from '../screen/app/VideoCallScreen'


const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const generateRoomId = (id1, id2) => [id1, id2].sort().join('__');

const AuthNavigate = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Onboard" component={Onboard} />
      <AuthStack.Screen name="SignIn" component={SignIn} />
      <AuthStack.Screen name="SignUp" component={SignUp} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />

    </AuthStack.Navigator>
  );
};



export default function Navigation(props) {

  const [callKey, setCallKey] = useState(0);

  // ── Pull user info from Redux instead of AsyncStorage ──
  // const currentUserId   = useSelector((state) => state.auth.user?._id);
  // const currentUserName = useSelector((state) => state.auth.user?.name);
  // const authToken       = useSelector((state) => state.auth.token);

  const bumpCallKey = () => setCallKey((k) => k + 1);


  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={"Auth"}
      >
        <Stack.Screen name="Auth" component={AuthNavigate} />
        <Stack.Screen name="App" component={TabNav} />
        <Stack.Screen name="ChatDetail" component={ChatDetail} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Menu" component={Menu} />
        <Stack.Screen name="Music" component={Music} />
        <Stack.Screen name="Banner" component={Banner} />
        <Stack.Screen name="VideoCall" options={{ animation: 'fade' }}>
          {(props) => {
            const {
              roomId, calleeId,
              calleeName, callerName,
              isInitiator,
            } = props.route.params;

            return (
              <VideoCallScreen
                key={callKey}
                roomId={roomId}
                // userId={currentUserId}
                calleeId={calleeId || ''}
                calleeName={calleeName}
                // callerName={callerName || currentUserName}
                isInitiator={isInitiator}
                onHangup={() => {
                  bumpCallKey();          // reset call state for next call
                  props.navigation.goBack();
                }}
              />
            );
          }}
        </Stack.Screen>
        

      </Stack.Navigator>




    </NavigationContainer>
  );
}


