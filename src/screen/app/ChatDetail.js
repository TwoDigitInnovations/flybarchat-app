import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput,FlatList,KeyboardAvoidingView,Platform,Keyboard,Dimensions,
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Back2Icon, CallIcon, LikeIcon, MicIcon, MusicIcon, PlusIcon, SendIcon, SmileIcon, VideoIcon,  } from '../../Assets/theme'
import Constants, { FONTS } from '../../Assets/Helpers/constant'
import { goBack, navigate } from '../../../utils/navigationRef'
import { useDispatch, useSelector } from 'react-redux'
import { socket } from '../../../utils'
import { checkConnection } from '../../../redux/connection/connectionAction'
import moment from 'moment'
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../utils/config';
import IncomingCallScreen from './IncommingCallScreen'
import InCallManager from 'react-native-incall-manager';


const ChatDetail = (props) => {
  const dispatch = useDispatch();

const routeData = props?.route?.params;
console.log('routeData',routeData)
const [connectionId, setConnectionId] = useState(routeData?.connection || null);

  const user = useSelector(state => state.auth.user);
    const [message, setmessage] = useState('');
  const [userimg, setuserimg] = useState('');
  const listRef = useRef();
  const [list, setlist] = useState([]);
  useEffect(() => {
  if (!connectionId) {
    console.log('enter')
    getConnection({
      sender: user?._id,
      receiver: routeData?._id,
    });
  }
}, [connectionId]);
useEffect(() => {
  if (connectionId) {
    getchat();
    socket.emit("join_chat", connectionId);
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 1500);

    return () => {
      socket.off('join_chat');
      socket.off('connection');
      socket.off('messages');
      socket.off('allmessages');
      socket.off('joined-user');
    };
  }
}, [connectionId]);
  useEffect(() => {
    getchat()
    socket.on("connectionCreated", (id) => {
  setConnectionId(id);
  socket.emit("join_chat", id);
});
    socket.on('messages', msg => {
      // console.log('===>', msg);
      setlist(msg);
      listRef.current?.scrollToEnd({ animated: true });
    });
    socket.on('allmessages', msg => {
      console.log('===>', msg);
      setlist(msg);
      listRef.current?.scrollToEnd({ animated: true });
    });
    socket.on('joined-user', data => {
      console.log(`new user joind --------------> ${data}`)
    });
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 1500);

    return () => {
      // socket.off('messages');
      // socket.off('allmessages');
      // socket.off('joined-user');
    };
  }, [socket]);


  const sendmessage = async () => {
    console.log('user',user)
    const payloads = {
      receiver: routeData?._id,
      message: message,
      connection: connectionId,
      sender: user._id,
    };
    console.log('payloads',payloads)
    socket.emit('createMessage', payloads);
    setmessage('');
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 1000);
    if (!connectionId) {
      getConnection({sender:user._id,receiver: routeData?._id,})
    }
    // return
  };

  const getchat = async () => {

    const payloads = {
      receiver: routeData?._id,
      // message: message,
      // connection: notificationDetails?._id,
      connection: connectionId,
      // sender: '66c08f4b5529f058df6f56d8',
      sender: user._id,
      // key: 'travelerSocket',
    };
    // console.log('pressed');
    socket.emit('getMessages', payloads);
    // setmessage('');
    // return
  };

  const renderMessage = ({ item }) => {
    // if (item.type === 'date') {
    //   return (
    //     <View style={styles.dateBadge}>
    //       <Text style={styles.dateText}>{item.text}</Text>
    //     </View>
    //   )
    // }

    if (item?.sender?._id == user?._id) {
      return (
        <View style={styles.sentMessageContainer}>
          <View style={styles.sentBubble}>
            <Text style={styles.sentText}>{item.message}</Text>
          </View>
          <Text style={styles.sentTime}>{item.time}</Text>
        </View>
      )
    }

    return (
      <View style={styles.receivedMessageContainer}>
        <Image
          source={item?.user?.image?{ uri: item.user.image }:require('../../Assets/Images/profile2.png')}
          style={styles.messageAvatar}
        />
        <View style={styles.receivedContent}>
          <View style={styles.receivedBubble}>
            <Text style={styles.receivedText}>{item?.message}</Text>
          </View>
          <Text style={styles.sentTime}>{moment(item?.lastMessage?.msgtime).format('DD-MM-YY hh:mm A')}</Text>
        </View>
      </View>
    )
  }
    const getConnection = (body) => {
    dispatch(checkConnection(body)).unwrap()
      .then(res => {
        console.log('data', res);
        setConnectionId(res?._id)
      })
      .catch(error => {
        console.error('GetOnline Users Error:', error);
      });
  }

  const [keyboardVisible, setKeyboardVisible] = useState(false);
    
      useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
          setKeyboardVisible(true);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
          setKeyboardVisible(false);
        });
    
        return () => {
          showSubscription.remove();
          hideSubscription.remove();
        };
      }, []);

      const generateRoomId = (id1, id2) => [id1, id2].sort().join('__');

const handleVideoCall = async () => {
    const roomId = generateRoomId(user?._id, routeData._id);

    try {
      console.log(user,routeData?._id,roomId)
        await fetch(`${SOCKET_URL}/notify-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callerId: user?._id,
                callerName: user?.name,
                calleeId: routeData._id,
                roomId,
            }),
        });
    } catch (err) {
        console.log('[ChatDetail] notify-call error:', err.message);
    }

    navigate('VideoCall', {
        roomId,
        calleeId: routeData._id,
        calleeName: routeData.name || routeData.username,
        callerName: user?.name,
        isInitiator: true,
    });
};

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => goBack()}
          >
            <Back2Icon height={24} width={24} />
          </TouchableOpacity>

          <Image
            source={routeData?.image?{ uri: routeData.image }:require('../../Assets/Images/profile2.png')}
            style={styles.headerAvatar}
          />
          
          <Text style={styles.headerName}>{routeData?.name}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            <CallIcon height={20} width={20}/>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerIconButton} onPress={()=>handleVideoCall()}>
            <VideoIcon height={20} width={20}/>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={list}
        ref={listRef}
        renderItem={renderMessage}
        keyExtractor={item => item._id}
        style={styles.messagesList}
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
                fontSize: 16,
                fontFamily: FONTS.Medium,
              }}>
              No Conversation Available
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={()=>navigate('Banner')}>
          <Text style={styles.wineGlass}>🍷</Text>
          <Text style={[styles.actionText,{marginLeft:0}]}>Offer a drink to unlock video call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={()=>navigate('Music')}>
          <MusicIcon height={20} width={20} />
          <Text style={styles.actionText}>Purchase and dedicate a song</Text>
        </TouchableOpacity>
      </View>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.inputIconButton}>
          <PlusIcon height={20} width={20} />
        </TouchableOpacity>
{/* 
        <TouchableOpacity style={styles.inputIconButton}>
          <MicIcon height={20} width={20} />
        </TouchableOpacity> */}

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Message"
            placeholderTextColor="#6a6a6a"
            value={message}
            onChangeText={setmessage}
            multiline
          />
        </View>

        {/* <TouchableOpacity style={styles.inputIconButton}>
          <SmileIcon height={20} width={20}/>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSend}
        >
          <LikeIcon height={20} width={20} />
        </TouchableOpacity> */}
        <TouchableOpacity onPress={() => sendmessage()} disabled={!message.trim()} style={{marginBottom:keyboardVisible&&Platform.Version<'35'?30:0}}>
            <SendIcon height={30} onPress={() => sendmessage()} color={message&&message.trim()?Constants.white:Constants.customgrey2}/>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default ChatDetail

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
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  headerName: {
    color: Constants.white,
    fontSize: 16,
    fontFamily:FONTS.SemiBold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  dateBadge: {
    alignSelf: 'center',
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 15,
  },
  dateText: {
    color: Constants.white,
    fontSize: 12,
    fontFamily:FONTS.SemiBold,
  },
  receivedMessageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  receivedContent: {
    flex: 1,
    // Width: '100%',
    alignSelf: 'flex-start',  // shrinks to content width
    maxWidth: '75%',
  },
  receivedBubble: {
    backgroundColor: '#2E3537',
    padding: 14,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
    alignSelf:'flex-start'
  },
  receivedText: {
    color: Constants.white,
    fontSize: 14,
    fontFamily:FONTS.Regular,
    lineHeight: 20,
  },
  sentMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  sentBubble: {
    backgroundColor: '#D9D9D9BF',
    padding: 14,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  sentText: {
    color: Constants.black,
    fontSize: 14,
    fontFamily:FONTS.Regular,
    lineHeight: 20,
  },
  sentTime: {
    color: Constants.white,
    fontSize: 11,
    fontFamily:FONTS.Regular,
    marginTop: 4,
    marginRight: 8,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A7ACAE59',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  wineGlass: {
    fontSize: 18,
    // marginRight: 10,
  },
  actionText: {
    color: Constants.white,
    fontSize: 14,
    fontFamily:FONTS.Medium,
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    // backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  inputIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor:Constants.customgrey2,
    borderRadius:25
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#2E3537',
    borderRadius: 20,
    paddingHorizontal: 16,
    // paddingVertical: 8,
    marginHorizontal: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  textInput: {
    color: Constants.white,
    fontSize: 14,
    fontFamily:FONTS.Regular,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
})