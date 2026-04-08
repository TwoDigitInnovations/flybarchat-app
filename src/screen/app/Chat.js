import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  Dimensions 
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Back2Icon, SearchIcon } from '../../Assets/theme'
import Constants, { FONTS } from '../../Assets/Helpers/constant'
import { goBack, navigate } from '../../../utils/navigationRef'
import { getConnection } from '../../../redux/connection/connectionAction'
import { useDispatch } from 'react-redux'
import moment from 'moment'
import { useIsFocused } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

const { width } = Dimensions.get('window')

const Chat = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('')
  const [chatList, setChatList] = useState([])
  const IsFoucused=useIsFocused()
  useEffect(()=>{
    if (IsFoucused) {
      getConnectionList()
    }
  },[IsFoucused])

const getConnectionList = (keywor) => {
    dispatch(getConnection(keywor)).unwrap()
      .then(res => {
        console.log('data', res);
        setChatList(res)
      })
      .catch(error => {
        console.error('GetOnline Users Error:', error);
      });
  }
  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      key={item?._id}
      activeOpacity={0.7}
      onPress={() => navigate('ChatDetail', { _id:item?.user?._id,connection:item?._id,image:item?.user?.image,name:item?.user?.name })}
    >
      <View style={styles.chatLeft}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item?.user?.image }}
            style={styles.avatar}
          />
          {/* {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )} */}
        </View>

        <View style={styles.chatInfo}>
          <Text style={styles.chatName} numberOfLines={1}>{item?.user?.name}</Text>
          <Text style={styles.chatMessage} numberOfLines={1}>{item?.lastMessage?.message}</Text>
        </View>
      </View>

      <Text style={styles.chatTime}>{moment(item?.lastMessage?.msgtime).format('DD-MM-YY hh:mm A')}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => goBack()}
        >
          <Back2Icon height={24} width={24} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{t("Messages")}</Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon height={20} width={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("Search")}
            placeholderTextColor={Constants.greish_pink}
            value={searchQuery}
            onChangeText={(name)=>{
              getConnectionList(name), setSearchQuery(name);
            }}
          />
        </View>
      </View>

      {/* Chats Section */}
      <View style={styles.chatsSection}>
        <Text style={styles.sectionTitle}>{t("Chats")}</Text>

        <FlatList
          data={chatList}
          renderItem={renderChatItem}
          keyExtractor={item => item._id}
          style={styles.chatsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              height: Dimensions.get('window').height - 200,
            }}>
            <Text
              style={{
                color: Constants.black,
                fontSize: 16,
                fontFamily: FONTS.Medium,
              }}>
              {t("No Chat Available")}
            </Text>
          </View>
        )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

    </View>
  )
}

export default Chat

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
    fontFamily:FONTS.SemiBold,
  },
  placeholder: {
    width: 44,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#93025F87',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Constants.black,
    fontSize: 16,
    paddingVertical: 10,
    fontFamily:FONTS.Medium
  },
  chatsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: Constants.black,
    fontSize: 18,
    fontFamily:FONTS.SemiBold,
    marginBottom: 20,
  },
  chatsList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  chatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#c41e3a',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Constants.light_black,
  },
  unreadCount: {
    color: Constants.black,
    fontSize: 12,
    fontFamily:FONTS.SemiBold,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    color: Constants.dark_black,
    fontSize: 16,
    fontFamily:FONTS.SemiBold,
    marginBottom: 4,
  },
  chatMessage: {
    color: Constants.dark_black,
    fontSize: 14,
    fontFamily:FONTS.Regular,
  },
  chatTime: {
    color: '#11141A',
    fontSize: 12,
    fontFamily:FONTS.Regular,
  },
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: 71,
  },
})