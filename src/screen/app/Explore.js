import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Dimensions, 
  FlatList
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Back2Icon, Chat2Icon, } from '../../Assets/theme'
import Constants, { FONTS } from '../../Assets/Helpers/constant'
import { useDispatch, useSelector } from 'react-redux'
import { getOnlineUsers } from '../../../redux/auth/authAction'
import { navigate } from '../../../utils/navigationRef'
import { checkConnection } from '../../../redux/connection/connectionAction'
import { useTranslation } from 'react-i18next'

const { width } = Dimensions.get('window')
const cardWidth = (width - 40) / 2

const Explore = ({ navigation }) => {

  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [curentData, setCurrentData] = useState([]);
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [onlineUserList, setOnlineUserList] = useState([]);
  useEffect(() => {
    getOnlineUsersPage(1);
  }, [])

  const getOnlineUsersPage = (page) => {
    setPage(page);
    dispatch(getOnlineUsers({page,limit: 20})).unwrap()
      .then(data => {
        console.log('data', data);
        setCurrentData(data);
        if (page === 1) {
          setOnlineUserList(data);
        } else {
          setOnlineUserList([...onlineUserList, ...data]);
        }
      })
      .catch(error => {
        console.error('GetOnline Users Error:', error);
      });
  };

  const getAgeFromDOB = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  // If birthday hasn't occurred yet this year, subtract 1
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

  const fetchNextPage = () => {
    if (curentData.length === 20) {
      getOnlineUsersPage(page + 1);
    }
  };

  const renderUserCard = (userData, index) => {
    const isOdd = onlineUserList.length % 2 !== 0
    const isLastItem = index === onlineUserList.length - 1
    const isFullWidth = isOdd && isLastItem

    return (
      <TouchableOpacity 
        key={userData?._id}
        style={[
          styles.userCard,
          isFullWidth && styles.userCardFull,
          {marginBottom:isLastItem?110:20}
        ]}
        activeOpacity={0.9}
        onPress={()=>getConnection(userData)}
      >
        <Image
          source={{ uri: userData?.image }}
          style={styles.userCardImage}
        />
        
        <View style={styles.gradientOverlay} />
        <View style={styles.userCardInfo}>

          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{t("Online")}</Text>
          </View>

          {/* <View style={styles.chatIconButton}> */}
          <Chat2Icon height={36} width={36} />
         {/* </View> */}
          </View>

          <Text style={styles.userCardName}>{userData?.name}, {getAgeFromDOB(userData?.dob)}</Text>

          {/* <View style={styles.locationRow}>
            <LocationIcon height={14} width={14} />
            <Text style={styles.locationText}>{userData?.location}</Text>
          </View> */}
        </View>

      </TouchableOpacity>
    )
  }

  const getConnection = (body) => {
      dispatch(checkConnection({sender:user?._id,receiver: body?._id,})).unwrap()
        .then(res => {
          console.log('data', res);
          if (res?._id) {
            navigate('ChatDetail',{...body,connection:res?._id})
          } else{
          navigate('ChatDetail',body)
          }
        })
        .catch(error => {
          console.error('GetOnline Users Error:', error);
        });
    }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Back2Icon height={24} width={24} color={Constants.black} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{t("Explore")}</Text>
        
          {/* <NotificationIcon height={45} width={45} /> */}
          <View style={{ width: 45 }} />
      </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>{t("Who's Online at Bar")}</Text>

        <FlatList
        data={onlineUserList}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index}) => renderUserCard(item, index)}
        keyExtractor={(item) => item._id}
        numColumns={2}
        onEndReached={() => {
            if (onlineUserList && onlineUserList.length > 0) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.05}
        />
    </View>
  )
}

export default Explore

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.light_black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Constants.black,
    fontSize: 18,
    fontFamily:FONTS.Inter_SemiBold,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    color: Constants.black,
    fontSize: 16,
    fontFamily:FONTS.Inter_Medium,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    width: cardWidth,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    marginLeft: 15,
    position: 'relative',
  },
  userCardFull: {
    width: cardWidth,
  },
  userCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'transparent',
    background: 'linear-gradient(to top, rgba(0,0,0,0.05), transparent)',
    // For React Native, we'll use a darker overlay at the bottom
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  userCardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 6,
  },
  onlineText: {
    color: Constants.white,
    fontSize: 12,
    fontFamily:FONTS.Medium,
  },
  userCardName: {
    color: Constants.white,
    fontSize: 14,
    fontFamily:FONTS.SemiBold,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: Constants.white,
    fontSize: 12,
    marginLeft: 4,
    fontFamily:FONTS.Regular,
  },
  chatIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})