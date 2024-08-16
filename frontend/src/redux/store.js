import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import selectedChatReducer from './reducers/selectedChat.js';
import UserReducer from './reducers/User.js'

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
};

const persistedSelectedChatReducer = persistReducer(persistConfig, selectedChatReducer);
const persistedUserReducer = persistReducer(persistConfig, UserReducer);


export const store = configureStore({
    reducer: {
        selectedChat: persistedSelectedChatReducer,
        User: persistedUserReducer,

    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export let persistor = persistStore(store);
