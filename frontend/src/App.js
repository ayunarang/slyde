import React, { lazy} from 'react'
import './App.css'
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {persistor, store} from './redux/store.js';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Login from '../src/Components/Login/Login.jsx';
import Rooms from '../src/Components/Rooms/Rooms.jsx'
import VideoChat from '../src/Components/VideoChat/VideoChat.jsx'
// import {SocketProvider} from './Components/Context/SocketProvider.jsx'


const App = () => {

  return (
    // <SocketProvider>
<Provider store= {store}>
<PersistGate loading={null} persistor={persistor}>
    <Router>
    <Routes>
      <Route exact path="/" element={<Login/>} />
      <Route exact path="/rooms" element={<Rooms />} />
      <Route exact path="/rooms/:roomIdUrl" element={<Rooms />} />
      <Route exact path="/videochat/:room" element={<VideoChat />} />
    </Routes>

</Router>
</PersistGate>
</Provider>
// </SocketProvider>
  )
}

export default App








