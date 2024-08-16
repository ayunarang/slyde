import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Rooms.css'
import axios from 'axios';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import { grey } from '@mui/material/colors';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CallIcon from '@mui/icons-material/Call';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import Badge from '@mui/material/Badge';
import OutboundIcon from '@mui/icons-material/Outbound';
import AddIcon from '@mui/icons-material/Add';
import Search from '@mui/icons-material/Search';
import VideocamIcon from '@mui/icons-material/Videocam';
// import {useSocket} from '../Context/UseSocket.js'
import { debounce, ListItemText } from '@mui/material';
import { io } from 'socket.io-client'
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setselectedChat } from '../../redux/reducers/selectedChat.js';
import { setUser, updateOnlineStatus, updateRoomInfo, initializeRooms } from '../../redux/reducers/User.js';

let socket;

const Rooms = () => {

  const dispatch = useDispatch();
  const navigate= useNavigate();
  const SelectedChat = useSelector((state) => state.selectedChat?.selectedChat);



  const [message, setmessage] = useState('');
  const [messageArray, setmessageArray] = useState([]);
  const [sharedFiles, setsharedFiles] = useState(null);
  const [ShowModal, setShowModal] = useState(false);
  const [searchContact, setsearchContact] = useState('');
  const [StartNewMessage, setStartNewMessage] = useState(false);
  const [selectedCategoryTab, setselectedCategoryTab] = useState('All');
  const [searchSuggestions, setsearchSuggestions] = useState([]);
  const [socketConnected, setsocketConnected] = useState(false);
  const [roomId, setroomId] = useState(null);
  const [chatlist, setchatlist] = useState([]);

  const userId = localStorage.getItem('userId')

  const { roomIdUrl } = useParams();

  const rooms = useSelector((state) => state.User.rooms);
  // const socket= useSocket()

  const getRoomChatLatest = (roomId) => {
    const getRoom = rooms.find(room => room.roomId === roomId);
    return getRoom ? getRoom : null;
  };


  useEffect(() => {

     socket = io('http://localhost:4000',{
      auth:{
          token:userId
      }
  });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('getOnlineStatus', id => {
      console.log(`User ${id} has come online`)
      dispatch(updateOnlineStatus(true));

    })

    socket.on('getOfflineStatus', id => {
      console.log(`User ${id} has gone offline`)
      dispatch(updateOnlineStatus(false));

    })

    socket.on('receive:message', (data) => {
      console.log("this tab's user id", userId)
      console.log("receiver id given", data.receiver_id)
      console.log("selected chat room id", SelectedChat.roomId)
      console.log("roomid url", roomIdUrl)
      if (data.receiver_id === userId && data.room_id === roomIdUrl) {

        setmessageArray((prev) => [
          ...prev,
          {
            content: data.messageReceived,
            sender: { _id: data.sender_id },
            createdAt: new Date(),
          }
        ]);

        dispatch(updateRoomInfo({ roomId: data.room_id, chatLatest: data.messageReceived, sentBy: data.sender_id }));
        // dispatch(setUser({chatLatest: data.messageReceived}));

        //set chatlatest for this particular user in redux

      }

    });

  }, [userId, SelectedChat, roomIdUrl]);

  useEffect(() => {
    getRoomlist();

  }, []);

  useEffect(() => {

    console.log("message array", messageArray)

  }, [messageArray]);

  const handleMessageInput = (e) => {
    const value = e.target.value;
    setmessage(value)
  }

  const handleSearchContact = (e) => {
    const value = e.target.value;
    console.log(value)
    setsearchContact(value);
  }

  useEffect(() => {
    searchApi(searchContact);
  }, [searchContact]);

  const handleNewContact = () => {
    console.log(searchContact);
  }

  const closeModal = () => {
    setShowModal(false);
    setsearchContact('');
  }

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
      scrollToBottom();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageArray]);

  const handleSendMessage = () => {
    setmessageArray(prev => [
      ...prev,
      {
        content: message,
        sender: { _id: userId },
        createdAt: new Date(),
      }
    ]);
    socket.emit('new:message', { sender_id: userId, receiver_id: SelectedChat.chatWith._id, message: message, room_id: SelectedChat.roomId });
    console.log("message sent to ", SelectedChat.chatWith.username, "with id:", SelectedChat.chatWith._id, "by:", userId);
    setmessage('')
    AddMessagesInDB({ content: message, sender: userId, receiver: SelectedChat.chatWith._id });
    dispatch(updateRoomInfo({ roomId: SelectedChat.roomId, chatLatest: message, SentBy: userId }));
  }





  const truncateMessage = (message) => {
    const wordLimit = 4;
    const words = message.split(' ');
    if (words.length <= wordLimit) {
      return message;
    }
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const handleSelectedChat = (chat) => {
    setStartNewMessage(false);
    console.log(chat);
    console.log("dispatching")
    dispatch(setselectedChat(chat));
    getChatMessages(chat.roomId);
  }

  const handleNewChat = () => {
    setShowModal(true);
  }

  const handleSelectSuggestion = (suggestion) => {
    console.log(suggestion);
    setStartNewMessage(true);
    // setSelectedChat(suggestion);
    // dispatch(setselectedChat(chat));
    handleSelectChatApi(userId, suggestion._id);
    closeModal();
  }


  const searchApi = debounce(
    async (searchContact) => {
      try {
        if (searchContact.length > 0) {
          console.log(searchContact)
          const response = await axios.post('http://localhost:4000/api/contacts/search',
            { searchContact });
          console.log(response.data.contacts);
          setsearchSuggestions(response.data.contacts);

        }
      }
      catch (error) {
        console.log(error.message)
      }
    }, 300)


  const handleSelectChatApi = async (userId, selectedChatId) => {
    try {
      const response = await axios.post('http://localhost:4000/api/contacts/room',
        { userId: userId, selectedChatId: selectedChatId });
      console.log(response.data);
      setmessageArray(response.data.messages)
      const roomId = response.data.roomId;
      console.log(roomId);
      socket.emit('room:join', roomId);
    }
    catch (error) {
      console.log(error.message);
    }
  }

  const getRoomlist = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/contacts/contactlist',
        { params: { userId } });
      const chatlistData = response.data.chatlist;
      setchatlist(chatlistData);
      console.log(response.data)
      chatlistData.map((chatlist, index) => {
        dispatch(initializeRooms(chatlist.roomId));
      })

    }
    catch (error) {
      console.log(error.message)
    }
  }

  const getChatMessages = async (roomId) => {
    try {
      const response = await axios.get('http://localhost:4000/api/contacts/chatMessages',
        {
          params: {
            userId: userId,
            roomId: roomId
          }
        })
      console.log(response.data)
      setmessageArray(response.data.room.messages)
    }
    catch (error) {
      console.log(error.message)
    }
  }

  const AddMessagesInDB = async (data) => {
    try {
      const response = await axios.post('http://localhost:4000/api/contacts/saveChat',
        { data });
      console.log(response);
    }
    catch (error) {
      console.log(error.message)
    }
  }

  useEffect(() => {
    socket.on('room:join',(data)=>{
      navigate(`/videochat/${data.roomId}`)
    } )  

  }, []);


  return (
    <div className="room-outer-container">
      <div className="room-profile-container">
        <div className="extra-option-container">
          <div className="option-element">
            <HomeIcon sx={{ color: 'whitesmoke' }} />
          </div>
          <div className="option-element">
            <ChatIcon sx={{ color: 'whitesmoke' }} />
          </div>
          <div className="option-element">
            <SettingsIcon sx={{ color: 'whitesmoke' }} />
          </div>
        </div>
        <div className="profile-info-container">
          <div className="profile-option-element user-profile-settings"></div>
          <div className="profile-option-element">
            <LogoutIcon sx={{ color: 'whitesmoke' }} />
          </div>
        </div>
      </div>
      <div className="room-chatlist-container">
        <div className="chat-filter-container">
          <div className="chatlist-heading">Chats</div>
          <div className="chat-options-container">
            <div className="new-chat-button" onClick={handleNewChat}>
              <AddIcon />
            </div>
            <div className="chat-search-button">
              <SearchIcon />
            </div>
          </div>
        </div>
        <div className="chatlist-elements-container">
          <div className="category-heading-container">
            <button
              value="New"
              onClick={(e) => {
                setselectedCategoryTab(e.target.value);
                console.log(e.target.value);
              }}
              className={`chatlist-category-heading ${selectedCategoryTab === 'New' ? 'selected-category-tab' : ''}`}
            >
              New
            </button>
            <button
              value="All"
              className={`chatlist-category-heading ${selectedCategoryTab === 'All' ? 'selected-category-tab' : ''}`}
              onClick={(e) => {
                setselectedCategoryTab(e.target.value);
              }}
            >
              All
            </button>
          </div>
          {chatlist &&
            chatlist.map((chat, index) => {
              const roomIdUrl = chat.roomId;
              const chatLast = chat?.messages && chat.messages.length > 0
                ? chat.messages[chat.messages.length - 1] : null;

              return (
                <Link key={roomIdUrl} to={`/rooms/${roomIdUrl}`}>
                  <div
                    className="chatlist-element"
                    key={index}
                    onClick={() => handleSelectedChat(chat)}
                  >
                    <div className="chat-name-outer-container">
                      <div className="user-profile-pic"></div>
                      <div className="chat-name-container">
                        <div className="chat-name">{chat.chatWith.username}</div>
                        <div className="chat-latest">
                          <div className="chat-latest-content">
                            {
                              (getRoomChatLatest(chat.roomId) !== null) ?
                                truncateMessage(getRoomChatLatest(chat.roomId).chatLatest)
                                :
                                chatLast?.content
                            }
                          </div>
                          <div className="chat-latest-status">
                            {
                              (getRoomChatLatest(chat.roomId) !== null) ?
                                (getRoomChatLatest(chat.roomId).SentBy === userId) ? 'Sent' : ''
                                :
                                (chatLast?.sender._id === userId) ? 'Sent' : ''
                            }

                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="chat-online-icon">
                      <Badge
                        badgeContent=" "
                        color={chat.chatWith.isOnline ? 'info' : 'default'}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      {(SelectedChat) ?
        <>
          <div className="room-message-container">
            <div className="message-container-header">
              <div className="message-header-info">
                <div className="chat-name-outer-container">
                  <div className="chat-profile-pic"></div>
                  <div className="chat-name-container">
                    <div className="chat-name">
                      {SelectedChat?.chatWith && SelectedChat.chatWith.username}
                    </div>
                    <div className="online-status">
                      {`${SelectedChat.chatWith?.isOnline ? 'Online' : 'Offline'}`}
                    </div>
                  </div>
                </div>
              </div>
              <div className="message-header-icons-container">
                <div className="message-header-icons">
                  <AttachFileIcon
                    sx={{ color: '#497174', height: '1.35rem', width: '1.35rem' }}
                  />
                </div>
                <div className="message-header-icons">
                  <VideocamIcon
                    sx={{ color: '#497174', height: '1.35rem', width: '1.35rem' }}
                    onClick={()=>{
                      socket.emit('room:join', {roomId: SelectedChat.roomId, from: userId} )
                      }}
                  />
                </div>
                <div className="message-header-icons">
                  <DeleteIcon
                    sx={{ color: '#497174', height: '1.35rem', width: '1.35rem' }}
                  />
                </div>
              </div>
            </div>
            <div className="message-outer-container">
              <div className="message-inner-container">
                <div className="message-content-container">
                  {SelectedChat.messages.map((message, index) => {
                    const isSender =
                      message.sender && message.sender._id === userId;
                    const messageTime = new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div
                        key={index}
                        ref={isSender ? messagesEndRef : null}
                        className={`message ${isSender ? 'message-sender' : 'message-receiver'}`}
                      >
                        <div className="message-content">
                          {message.content}
                        </div>
                        <div className="message-timestamp">
                          {messageTime.toLowerCase()}
                        </div>
                      </div>
                    );
                  })}

{Array.isArray(messageArray) && messageArray.length > 0 ? (
  messageArray.map((message, index) => {
    const isSender = message.sender && message.sender._id === userId;
    const messageTime = new Date(message.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <div
        key={index}
        ref={isSender ? messagesEndRef : null}
        className={`message ${isSender ? 'message-sender' : 'message-receiver'}`}
      >
        <div className="message-content">
          {message.content}
        </div>
        <div className="message-timestamp">
          {messageTime.toLowerCase()}
        </div>
      </div>
    );
  })
) : null}



                </div>
              </div>
              <div className="message-input-container">
                <div className="options-send-btn">
                  <AddIcon
                    sx={{ color: 'black', height: '1.8rem', width: '1.8rem' }}
                  />
                </div>
                <input
                  className="message-input"
                  placeholder="Type something..."
                  onChange={handleMessageInput}
                  value={message}
                  onKeyDown={handleKeyDown}
                ></input>
                <div className="message-send-btn" onClick={handleSendMessage}>
                  Send
                  <OutboundIcon
                    sx={{
                      color: 'white',
                      height: '1.8rem',
                      width: '1.8rem',
                      marginLeft: '0.5rem',
                    }}
                    className="send-btn"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="user-profile-information-container">
            <div className="user-profile-pic-container">
              <div className="main-profile-picture"></div>
              <div className="profile-chat-name">
                {SelectedChat.chatWith && SelectedChat.chatWith.username}
              </div>
            </div>
            <div className="shared-files-container">
              <div className="shared-files-heading-container">
                <div className="shared-files-heading">Media, Files and Links</div>
                <div className="search-media-icon">
                  <SearchIcon />
                </div>
              </div>
              <div className="shared-files-options">
                <div className="media-type">Media</div>
                <div className="media-type">Files</div>
                <div className="media-type">Links</div>
              </div>
              <div className="shared-files-listing-container">
                {sharedFiles ? (
                  <div className="shared-files-listings"></div>
                ) : (
                  'Nothing shared'
                )}
              </div>
            </div>
          </div>
        </> : ''}




      {ShowModal && (
        <div className="new-contact-modal">
          <div className="modal-content">
            <span className="modal-close-button" onClick={closeModal}>
              &times;
            </span>
            <div className="modal-custom-container">
              <p className="add-contact-heading">Search Contact</p>
              <div className="add-contact-container">
                <input
                  className="add-contact-input"
                  placeholder="Search for a contact"
                  value={searchContact}
                  name="NewTask"
                  type="text"
                  onChange={handleSearchContact}
                ></input>
                <div className="contact-suggestion-container">
                  {searchSuggestions &&
                    searchSuggestions.map((suggestions, index) => {
                      return (
                        <div
                          className="contact-suggestion"
                          key={index}
                          onClick={() => handleSelectSuggestion(suggestions)}
                        >
                          <div className="suggestion-profile-pic"></div>
                          <div className="username-suggestion">
                            {suggestions.username}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              <button
                className="add-contact-button"
                onClick={() => {
                  console.log(searchContact);
                  handleNewContact();
                  closeModal();
                }}
              >
                Add Contact +
              </button>
              <button className="exit-modal" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}

export default Rooms



