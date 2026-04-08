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
import { MocktailIcon, NotificationIcon } from '../../Assets/theme'
import Constants, { FONTS } from '../../Assets/Helpers/constant'
import { getCarouselData, getOnlineUsers } from '../../../redux/auth/authAction'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from '../../../utils/navigationRef'
import SwiperFlatList from 'react-native-swiper-flatlist'
import Scheliton from '../../Assets/Component/Scheliton'
import { hp } from '../../../utils/responsiveScreen'
import { useTranslation } from 'react-i18next';

const Home = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const {width} = Dimensions.get('window');
  const [carosalimg, setcarosalimg] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [onlineUserList, setOnlineUserList] = useState([]);
  const user = useSelector(state => state.auth.user);
  useEffect(() => {
    getOnlineUser();
    getCarousel();
  }, [])

  const getCarousel = () => {
    dispatch(getCarouselData()).unwrap()
      .then(data => {
        console.log('Carousel Data:', data);
        if (data?.setting?.length>0) {
          setcarosalimg(data?.setting[0]?.carousel)
        }
      })
      .catch(error => {
        console.error('Get Carousel Data Error:', error);
      });
  };
  const getOnlineUser = () => {
dispatch(getOnlineUsers({page: 1, limit: 4})).unwrap()
      .then(data => {
        console.log('data', data);
        setOnlineUserList(data);
      })
      .catch(error => {
        console.error('GetOnline Users Error:', error);
      });
  }

  const renderOnlineUser = ({ item }) => (
    <TouchableOpacity style={styles.userCard}>
      <View style={styles.userImageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.userImage}
        />
        {true&& <View style={styles.onlineDot} />}
      </View>
      <Text style={styles.userName}>{item.name}</Text>
    </TouchableOpacity>
  )

  const CustomPagination = ({data, index}) => {
    return (
      <View style={styles.paginationContainer}>
        {data.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigate('Profile')}>
          <Image
            source={user?.image?{uri: user?.image}:require('../../Assets/Images/profile2.png')}
            style={styles.profileImage}
          />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <View style={styles.greetingRow}>
              <Text style={styles.hiText}>{t("Hi")}</Text>
            </View>
            <Text style={styles.userNameTop}>{user?.name}</Text>
          </View>
        </View>
          {/* <NotificationIcon height={45} width={45} /> */}
      </View>

      {/* App Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.appTitle}>{t("FLAY CHAT BAR")}</Text>
        <MocktailIcon height={28} width={28} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>{t("Welcome back")}, {user?.name}</Text>
          <Text style={styles.welcomeSubtitle}>
            {t("Discover people, start conversation,and enjoy virtual drinks.")}
          </Text>
        </View>

      {carosalimg && carosalimg?.length > 0 ? <View style={{marginTop: 15,marginBottom:25}}>
          <SwiperFlatList
            data={carosalimg || []}
            autoplay
            autoplayDelay={2}
            autoplayLoop
            onChangeIndex={({index}) => setCurrentIndex(index)}
            renderItem={({item, index}) => (
              <View
                style={{paddingBottom: 5, width: width, alignItems: 'center'}}>
                <Image
                    source={{uri: `${item?.image}`}}
                  // source={item.image}
                  style={{
                    height: 250,
                    width: '93%',
                    borderRadius: 20,
                  }}
                  resizeMode="stretch"
                  key={index}
                />
              </View>
            )}
          />
          {carosalimg&&carosalimg.length>0&&<CustomPagination data={carosalimg} index={currentIndex} />}
        </View>:<Scheliton height={hp(29)} width={'90%'} borderRadious={20} backgroundColor={'#5a5a5a'}/>}

        {/* Start Chat Button */}
        <TouchableOpacity style={styles.startChatButton}>
          <Text style={styles.startChatText}>{t("Start a free chat with people")}</Text>
        </TouchableOpacity>

        {/* Who's Online Section */}
        <View style={styles.onlineSection}>
          <View style={styles.onlineHeader}>
            <Text style={styles.onlineSectionTitle}>{t("Who's Online at Bar")}</Text>
            <TouchableOpacity onPress={()=>navigate('App',{screen:'Explore'})}>
              <Text style={styles.viewAllButton}>{t("View All")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.onlineUsersContainer}>
            <FlatList
              data={onlineUserList}
              renderItem={renderOnlineUser}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.usersList}
            />
          </View>
        </View>

      </ScrollView>
    </View>
  )
}

export default Home

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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  hiText: {
    fontSize: 14,
    color: Constants.dark_black,
    fontFamily:FONTS.Medium,
  },
  userNameTop: {
    color: Constants.dark_black,
    fontSize: 16,
    fontFamily:FONTS.SemiBold,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  appTitle: {
    color: Constants.black,
    fontSize: 20,
    fontFamily:FONTS.SemiBold,
    letterSpacing: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF42',
    width: '90%',
    alignSelf:'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    justifyContent:'center',
    alignItems:'center',
    boxShadow: '0px 2px 4px 0.5px gray',
  },
  welcomeTitle: {
    color: Constants.black,
    fontSize: 18,
    fontFamily:FONTS.Inter_SemiBold,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: Constants.black,
    fontSize: 12,
    fontFamily:FONTS.Inter_Medium,
    lineHeight: 20,
    textAlign:'center'
  },
  startChatButton: {
    backgroundColor: '#FFFFFF42',
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    boxShadow: '0px 2px 4px 0.5px gray',
  },
  startChatText: {
    color: Constants.black,
    fontSize: 16,
    fontFamily:FONTS.Inter_SemiBold,
  },
  onlineSection: {
    marginBottom: 30,
  },
  onlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  onlineSectionTitle: {
    color: Constants.black,
    fontSize: 16,
    fontFamily:FONTS.Inter_Medium,
  },
  viewAllButton: {
    color: Constants.black,
    fontSize: 14,
    fontFamily:FONTS.SemiBold,
    backgroundColor: Constants.white,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    boxShadow: '0px 4px 4px 0px #0000001A',
  },
  onlineUsersContainer: {
    backgroundColor: '#FFFFFF42',
    paddingVertical: 15,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 130,
    boxShadow: '0px 2px 4px 0.5px gray',
  },
  usersList: {
    paddingHorizontal: 5,
  },
  userCard: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  userImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  userImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: Constants.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  userName: {
    color: Constants.dark_black,
    fontSize: 12,
    fontFamily:FONTS.Medium,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: -15,
    alignSelf: 'center',
    // marginTop: 10,
  },
  dot: {
    height: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 8,
    backgroundColor: Constants.black,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: Constants.greish_pink,
  },
})