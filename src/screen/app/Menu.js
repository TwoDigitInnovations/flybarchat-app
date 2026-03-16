import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { ArrowLeftIcon, ArrowRightIcon, Back2Icon } from '../../Assets/theme';
import { useDispatch } from 'react-redux';
import { getAllMenu } from '../../../redux/Menu/menuAction'
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';

const MenuItem = ({ item,index }) => {
  const [pressed, setPressed] = useState(false);
  const isRight = (index+1)%2===0;

  return (
    <TouchableOpacity
      style={[styles.menuItem, pressed && styles.menuItemPressed]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.85}
    >
      {/* Left side image */}
      {!isRight && (
        <View style={styles.imageWrapLeft}>
          <Image source={{uri:item?.image}} style={styles.emojiImage} />
          {item?.price && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{Currency}{item?.price}</Text>
            </View>
          )}
        </View>
      )}

      {/* Center content */}
      <View style={[styles.itemContent, isRight && styles.itemContentRight]}>
        <Text style={styles.itemName}>{item?.name}</Text>
        <Text style={styles.itemSubtitle}>{item.time} min video call</Text>
        {isRight?<ArrowRightIcon />:<ArrowLeftIcon />}
      </View>

      {/* Right side image */}
      {isRight && (
        <View style={styles.imageWrapRight}>
          {item?.price && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{Currency}{item?.price}</Text>
            </View>
          )}
          <Image source={{uri:item?.image}} style={styles.emojiImage} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function DrinkMenuScreen({ navigation }) {
  const dispatch = useDispatch();
  const [menuList,setMenuList]=useState([])
  useEffect(()=>{
     getMenuList()
  },[])
  const getMenuList = () => {
      dispatch(getAllMenu()).unwrap()
        .then(res => {
          console.log('data', res);
          setMenuList(res)
        })
        .catch(error => {
          console.error('GetOnline Users Error:', error);
        });
    }
  return (
    <View style={styles.safeArea}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Back2Icon />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Drink Menu</Text>
          <Text style={styles.headerSubtitle}>Send a drink to Unlock video call</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      <FlatList
        data={menuList}
        renderItem={({item, index}) => (
          <View key={item._id} style={{width:'70%',alignSelf:(index+1)%2===0?'flex-end':'flex-start'}}>
            <MenuItem item={item} index={index} />
            {index < menuList.length - 1 && <View style={styles.itemDivider} />}
          </View>
        )}
        keyExtractor={item => item._id}
        // style={styles.messagesList}
        ListEmptyComponent={() => (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              height: Dimensions.get('window').height - 200,
            }}>
            <Text
              style={{
                color: Constants.white,
                fontSize: 18,
                fontFamily: FONTS.Medium,
              }}>
              No Conversation Available
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom CTA */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
          <Text style={styles.ctaText}>May be later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Constants.light_black,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  headerSpacer: {
    width: 36,
  },

  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 0,
  },

  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 100,
  },
  menuItemPressed: {
    backgroundColor: '#1A1A1A',
  },

  // Image areas
  imageWrapLeft: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 16,
  },
  imageWrapRight: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: 16,
  },
  emojiImage: {
    height: 52,
    width: 52,
    textAlign: 'center',
  },

  // Price Badge
  priceBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#C8922A',
    borderRadius: 14,
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  priceText: {
    color: Constants.white,
    fontSize: 12,
    fontFamily:FONTS.Medium,
    letterSpacing: 0.2,
  },

  // Item content
  itemContent: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight:20,
    marginLeft:0
  },
  itemContentRight: {
    alignItems: 'flex-start',
    marginRight:0,
    marginLeft:20
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  itemSubtitle: {
    color: Constants.customgrey3,
    fontSize: 13,
    marginBottom: 10,
    letterSpacing: 0.1,
  },


  // Item separator
  itemDivider: {
    height: 1,
    backgroundColor: Constants.customgrey3,
  },

  // Bottom CTA
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 24,
    backgroundColor: '#111111',
  },
  ctaButton: {
    backgroundColor: '#8B0000',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaText: {
    color: Constants.white,
    fontSize: 16,
    fontFamily:FONTS.SemiBold,
    letterSpacing: 0.3,
  },
});