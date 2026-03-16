import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Constants from '../Helpers/constant';

const Scheliton = (props) => {
    const translateX = useRef(new Animated.Value(0)).current;
  const [cardW, setCardW] = useState(0);
  const [bandW, setBandW] = useState(0);

  const start = useCallback(() => {
    if (!cardW || !bandW) return;
    // start just outside the left edge
    translateX.setValue(-bandW);
    Animated.loop(
      Animated.timing(translateX, {
        toValue: cardW, // travel past the right edge
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [cardW, bandW, translateX]);

  useEffect(() => {
    start();
  }, [start]);

  const onLayout = e => {
    const w = e.nativeEvent.layout.width;
    setCardW(w);
    setBandW(Math.max(60, Math.round(w * 0.85))); // ~85% wide shimmer band
  };
  return (
    <View onLayout={onLayout} style={[styles.card,{height:props.height||180,width:props.width||'95%',borderRadius:props.borderRadious||10,backgroundColor:props.backgroundColor||Constants.customgrey4}]}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.shimmer,
                    {width: bandW, transform: [{translateX}]},
                  ]}
                />
              </View>
  )
}

export default Scheliton

const styles = StyleSheet.create({
    card: {
    backgroundColor: Constants.customgrey4,
    padding: 15,
    margin: 10,
    height: 180,
    width: '95%',
    borderRadius: 8,
    alignSelf:'center',
    overflow: 'hidden', // keep shimmer clipped to card
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    // solid band (you can swap to a gradient later)
    backgroundColor: 'rgba(223, 216, 216, 0.35)',
  },
})