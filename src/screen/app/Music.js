import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  FlatList,
  Image,
} from 'react-native';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import { useDispatch } from 'react-redux';
import { getAllMusic } from '../../../redux/Music/musicAction';
import { Back2Icon } from '../../Assets/theme';
import { useTranslation } from 'react-i18next';

const CATEGORIES = ['Romantic', 'Popular', 'Trending', 'Classic'];

const songs = [
  { id: 1, title: 'Perfect', artist: 'Ed Sheeran', price: '$12.99', emoji: '🎵' },
  { id: 2, title: 'Love me like you do', artist: 'Ellie Golding', price: '$17.99', emoji: '💗' },
  { id: 3, title: 'Thinking Out Loud', artist: 'Ed Sheeran', price: '$9.99', emoji: '🎶' },
  { id: 4, title: 'New York City', artist: 'The Chainsmokers -', price: '$9.99', emoji: '🏙️' },
  { id: 5, title: 'Setting Fires', artist: 'The Chainsmokers, XYLO -', price: '$19.99', emoji: '🔥' },
  { id: 6, title: 'Somebody', artist: 'The Chainsmokers, Drew', price: '$15.99', emoji: '🎤' },
  { id: 7, title: 'New York City', artist: 'The Chainsmokers -', price: '$9.99', emoji: '🏙️' },
];

const SongItem = ({ song }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.songItem, pressed && styles.songItemPressed]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.85}
    >
      {/* Album art */}
      <View style={styles.albumArt}>
        <Image source={{uri:song?.image}} style={{height:'100%',width:'100%'}}/>
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{song?.name}</Text>
        {/* <Text style={styles.songArtist}>{song?.artist}</Text> */}
      </View>

      {/* Play + Price */}
      <View style={styles.songAction}>
        <Text style={styles.playIcon}>▶</Text>
        <Text style={styles.songPrice}>{Currency}{song?.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function SongsMenuScreen({ navigation }) {
  const { t } = useTranslation();
  // const [activeCategory, setActiveCategory] = useState('Romantic');
  const [displayCount, setDisplayCount] = useState(7); // Controls initial 10 items display
  const [seeMoreClicked, setSeeMoreClicked] = useState(false);
  const dispatch = useDispatch();
  const [musicList,setMusicList]=useState([])
  const [page, setPage] = useState(1);
  const [curentData, setCurrentData] = useState([]);

  useEffect(()=>{
     getMusicList(1)
  },[])
  const getMusicList = (page) => {
    setPage(page)
      dispatch(getAllMusic(page)).unwrap()
        .then(res => {
          console.log('data', res);
          setMusicList(res)
           setCurrentData(res);
        if (page === 1) {
          setMusicList(res);
        } else {
          setMusicList([...musicList, ...res]);
        }
        })
        .catch(error => {
          console.error('GetOnline Users Error:', error);
        });
    }

    const fetchNextPage = () => {
    if (curentData.length === 20) {
      getMusicList(page + 1);
    }
  };
const handleSeeMore = () => {
    setSeeMoreClicked(true);
    setDisplayCount(musicList.length); // Show all loaded items (20)
  };

  // Determine what data to show based on seeMoreClicked state
  const displayedSongs = seeMoreClicked ? musicList : musicList.slice(0, displayCount);
  // Show "See More" only if not clicked yet AND there are more than 7 items
  const showSeeMore = !seeMoreClicked && musicList.length > 7;
  return (
    <View style={styles.safeArea}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Back2Icon />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t("Songs")}</Text>
          <Text style={styles.headerSubtitle}>{t("Buy a song to dedicate the person")}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

    <ImageBackground style={{flex:1,}} source={require('.././../Assets/Images/musicbg.png')} resizeMode='stretch'>
      {/* Category Tabs */}
      {/* <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView> */}

      {/* Songs List */}
      {/* <View style={styles.listContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {songs.map((song) => (
            <SongItem key={song.id} song={song} />
          ))}

          <TouchableOpacity style={styles.seeMoreButton}>
            <Text style={styles.seeMoreText}>see more  ⌄</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>A Romantic Song will be sent to your date</Text>
        </ScrollView>
      </View> */}
      <FlatList
      data={displayedSongs}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={()=><View>
       {showSeeMore&& <View>
        <TouchableOpacity style={styles.seeMoreButton} onPress={handleSeeMore}>
            <Text style={styles.seeMoreText}>{t("See More")}  ⌄</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>{t("A Romantic Song will be sent to your date")}</Text>
          </View>}
      </View>}
      style={{marginTop:20}}
      renderItem={({item})=><SongItem key={item?._id} song={item} />}
      onEndReached={() => {
            if (seeMoreClicked && musicList && musicList.length > 0) {
              fetchNextPage();
            }
          }}
      onEndReachedThreshold={0.05} />

        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
          <Text style={styles.ctaText}>{t("May be later")}</Text>
        </TouchableOpacity>

    </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Constants.light_black,
  },

  // Decorative background
  bgArt: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 0,
  },
  bgText: {
    color: 'rgba(180,140,60,0.55)',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 1,
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
    color: Constants.white,
    fontSize: 18,
    fontFamily:FONTS.SemiBold,
  },
  headerSubtitle: {
    color: Constants.white,
    fontFamily:FONTS.Medium,
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  headerSpacer: {
    width: 36,
  },

  // Category tabs
  categoryScroll: {
    zIndex: 2,
    maxHeight: 48,
    backgroundColor:Constants.light_black,
    borderRadius:50,
    marginTop:10
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#111111',
    fontWeight: '700',
  },

  // List container (the dark floating card look)
  listContainer: {
    flex: 1,
    marginTop: 10,
    marginHorizontal: 12,
    // backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 4,
    paddingBottom: 8,
  },

  // Song item
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    marginVertical: 3,
    backgroundColor: Constants.light_black,
    borderRadius: 15,
  },
  songItemPressed: {
    backgroundColor: '#2A2A2C',
  },
  albumArt: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  albumEmoji: {
    fontSize: 24,
  },
  songInfo: {
    flex: 1,
    justifyContent:'center'
  },
  songTitle: {
    color: Constants.white,
    fontSize: 14,
    fontFamily:FONTS.Medium,
    marginBottom: 3,
  },
  songArtist: {
    color: Constants.customgrey2,
    fontFamily:FONTS.Regular,
    fontSize: 12,
  },
  songAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playIcon: {
    color: Constants.customgrey3,
    fontSize: 12,
    marginRight: 6,
  },
  songPrice: {
    color: Constants.white,
    fontSize: 14,
    fontFamily:FONTS.SemiBold,
  },

  // See more
  seeMoreButton: {
    alignSelf: 'center',
    backgroundColor: Constants.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  seeMoreText: {
    color: Constants.light_black,
    fontSize: 12,
    fontFamily:FONTS.SemiBold,
  },

  // Footer note
  footerNote: {
    color: Constants.white,
    fontSize: 12,
    fontFamily:FONTS.Regular,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 0.1,
  },

  ctaButton: {
    backgroundColor: Constants.custom_red,
    borderRadius: 14,
    paddingVertical: 13,
    marginHorizontal:10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Constants.custom_red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginBottom:15
  },
  ctaText: {
    color: Constants.white,
    fontSize: 16,
    fontFamily:FONTS.SemiBold,
  },
});