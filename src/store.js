import { createStore as createReduxStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { routerMiddleware } from 'react-router-redux'

import { createContractsFactory } from './contracts-factory';
import Reducers from './reducers';
import Sagas from './sagas';

export function createStore(history, web3) {
  const sagaMiddleware = createSagaMiddleware();
  const routeMiddleware = routerMiddleware(history);
  const contractsFactory = createContractsFactory(web3);
  const web3Middleware = store => next => action => {
    action.web3 = web3;
    action.contractsFactory = contractsFactory;
    next(action);
  }

  const store = createReduxStore(Reducers, applyMiddleware(sagaMiddleware,
    routeMiddleware, web3Middleware));

  sagaMiddleware.run(Sagas);

	return store;
}
