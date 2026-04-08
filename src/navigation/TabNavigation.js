import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Constants, { FONTS } from '../Assets/Helpers/constant';
import { HomeIcon,ExploreIcon,ChatIcon,AccountIcon } from '../Assets/theme';
import Home from '../screen/app/Home';
import Explore from '../screen/app/Explore';
import Chat from '../screen/app/Chat';
import Account from '../screen/app/Account';


const Tab = createBottomTabNavigator();

export const  TabNav=()=>{

  const tabOffsetValue = useRef(new Animated.Value(0)).current;
  function getWidth() {
    let width = Dimensions.get("window").width-30
    // Total four Tabs...
    return width / 4
  }

  const TabArr = [
    {
      iconActive: <HomeIcon color={Constants.white} size={22} />,
      iconInActive: <HomeIcon color={Constants.white} size={24} />,
      component: Home,
      routeName: 'Home',
    },
    {
      iconActive: <ExploreIcon color={Constants.white} size={20} />,
      iconInActive: <ExploreIcon color={Constants.white} size={22} />,
      component: Explore,
      routeName: 'Explore',
    },
    {
      iconActive: <ChatIcon color={Constants.white} size={20} />,
      iconInActive: <ChatIcon color={Constants.white} size={22} />,
      component: Chat,
      routeName: 'Chat',
    },
    {
      iconActive: <AccountIcon color={Constants.white} size={20} />,
      iconInActive: <AccountIcon color={Constants.white} size={20} />,
      component: Account,
      routeName: 'Account',
    },
  ];

  const TabButton = useCallback(
    (props) => {
      const isSelected = props?.['aria-selected'];
      const onPress = props?.onPress;
      const onclick = props?.onclick;
      const item = props?.item;
      const index = props?.index;

      useEffect(()=>{
        
        {isSelected && 
        Animated.spring(tabOffsetValue, {
         toValue: getWidth() * index,
         useNativeDriver: true
       }).start();}
 
       },[isSelected])
       
       const scaleAnim = useRef(new Animated.Value(1)).current;
       useEffect(() => {
        Animated.spring(scaleAnim, {
          toValue: isSelected ? 1.3 : 1, // scale up when selected, back when unselected
          useNativeDriver: true,
        }).start();
      }, [isSelected]);

      return (
        <View style={styles.tabBtnView}>
         {index ===0 &&<Animated.View style={{
        // width: getWidth() -15,
        height: 48,
        width: 48,
        backgroundColor: Constants.custom_red,
        position: 'absolute',
        top:Platform.OS==='android'? 11:0,
        borderRadius: 30,
        transform: [
          { translateX: tabOffsetValue }
        ]
      }}>
      </Animated.View>}
         
          <TouchableOpacity
            onPress={onclick ? onclick : onPress}
            style={[
              styles.tabBtn,
              // {backgroundColor:isSelected?Constants.custom_green:null}
            ]}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {isSelected ? item.iconActive : item.iconInActive}
            </Animated.View>
          </TouchableOpacity>
          {/* <Text style={[styles.tabtxt,{color:isSelected?Constants.custom_green:Constants.tabgrey}]} onPress={onclick ? onclick : onPress}>{item.name}</Text> */}
        </View>
      );
    },
    [],
  );

  return (
    
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          // width: '100%',
          height: Platform.OS==='ios'?90: 70,
          backgroundColor: '#EAC5E2',
          boxShadow: '0.5px 2px 5px 0.2px grey',
          borderRadius:40,
          bottom:20,
          marginHorizontal:15,

          // Hide border white line on top of tab bar
          borderTopWidth: 0,
          elevation: 0,        // Android
          shadowColor: 'transparent', // iOS
        },
      }}>
      {TabArr.map((item, index) => {
        return (
          <Tab.Screen
            key={index}
            name={item.routeName}
            component={item.component}
           
            options={{
              tabBarShowLabel: false,
              tabBarButton: props => (
                <TabButton {...props} item={item} index={index} />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBtnView: {
    // backgroundColor: isSelected ? 'blue' : '#FFFF',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:Platform.OS==='ios'?10:0
  },
  tabBtn: {
    height: 40,
    width: 40,
    // padding:10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
});
