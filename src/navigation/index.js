import React from 'react';
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


const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

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
        

      </Stack.Navigator>




    </NavigationContainer>
  );
}


