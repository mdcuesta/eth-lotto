import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux'

import { 
	SET_WEB3_COMPLETED, 
	SET_ACCOUNTS,
	SET_CURRENT_ACCOUNT,
	GET_CURRENT_ACCOUNT_BALANCE_COMPLETED,
	CHECK_DRAW_IS_OPEN_COMPLETED,
	CHECK_IS_CONTRACT_OWNER_COMPLETED,
	LOAD_CURRENT_POT_COMPLETED,
} from './actions';

function settings(state = {
	web3: {},
	isOwner: false,
}, action) {
	if (action.type === SET_WEB3_COMPLETED) {
		const newState = Object.assign({}, state, { 
			web3: action.web3
		});
		return newState;
	} else if (action.type === CHECK_IS_CONTRACT_OWNER_COMPLETED) {
		const newState = Object.assign({}, state, {
			isOwner: action.isOwner,
		});
		return newState;
	}
	return state;
}

function accounts(state = [], action) {
	if (action.type === SET_ACCOUNTS) {
		const newState = Object.assign([], state, action.accounts);
		return newState;
	}
	return state;
}

function currentAccount(state = {
	account: '',
	balance: 0,
}, action) {
	if (action.type === SET_CURRENT_ACCOUNT) {
		const newState = Object.assign({}, state, {
			account: action.account,
		});
		return newState;
	} else if (action.type === GET_CURRENT_ACCOUNT_BALANCE_COMPLETED) {
		const newState = Object.assign({}, state, {
			balance: action.balance,
		});
		return newState;
	}
	return state;	
}

function draw(state = {
	isOpen: false,
	pot: 0,
	ticketPrice: 1000000000000000000,
}, action) {
	if (action.type === CHECK_DRAW_IS_OPEN_COMPLETED) {
		const newState = Object.assign({}, state, {
			isOpen: action.isOpen,
		});
		return newState;
	} else if (action.type === LOAD_CURRENT_POT_COMPLETED) {
		const newState = Object.assign({}, state, {
			pot: action.pot
		});
		return newState;
	}
	return state;
}

const reducers = combineReducers({
  router: routerReducer,

  settings,
  accounts,
  currentAccount,
  draw,
});

export default reducers;
