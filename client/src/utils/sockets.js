// @flow
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from 'src/reducers';
import {
  addUser,
  messageReceived,
  populateUsersList,
} from 'src/reducers/actions';
import * as types from 'src/reducers/constants';
import type {
  MessageAction,
  UserAction,
  UserListAction,
  UserName,
} from 'src/reducers/types';

const setupSocket = (
  dispatch: (MessageAction | UserListAction | UserAction) => void,
  username: UserName,
) => {
  const { NODE_ENV = 'production', WEBSOCKET_DEV_PORT = 8989 } = process.env;
  const HOST = location.origin.replace(/^http/, 'ws');

  // If in development mode, hook up to local websocket running on separate server.
  // Otherwise, use current port
  const socket = new WebSocket(
    NODE_ENV === 'production' ? HOST : `ws://localhost:${WEBSOCKET_DEV_PORT}`,
  );

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: types.ADD_USER,
        name: username,
      }),
    );
  };

  socket.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(String(event.data));
    switch (data.type) {
      case types.ADD_MESSAGE:
        dispatch(messageReceived(data.message, data.author));
        break;
      case types.USERS_LIST:
        dispatch(populateUsersList(data.users));
        break;
      case types.ADD_USER:
        dispatch(addUser(data.user));
        break;
      default:
        break;
    }
  };

  return socket;
};

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducers, applyMiddleware(sagaMiddleware));

export { sagaMiddleware, setupSocket, store };
