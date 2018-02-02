import Promise from 'bluebird';
import { call, put, all, takeLatest } from 'redux-saga/effects';

import { 
	RAISE_ERROR, raiseError,
	SET_WEB3, SET_WEB3_COMPLETED, setWeb3Completed,
	SET_CURRENT_ACCOUNT, SET_CURRENT_ACCOUNT_COMPLETED, setAccounts, setCurrentAccount, setCurrentAccountCompleted,
	GET_CURRENT_ACCOUNT_BALANCE, getCurrentAccountBalance, getCurrentAccountBalanceStarted, getCurrentAccountBalanceCompleted,
	INITIATE_NEW_DRAW, initiateNewDrawStarted, initiateNewDrawCompleted,
	GET_CURRENT_DRAW, getCurrentDrawStarted, getCurrentDrawCompleted,
	CHECK_DRAW_IS_OPEN, checkDrawIsOpenStarted, checkDrawIsOpenCompleted,
	CHECK_IS_CONTRACT_OWNER, checkIsContractOwner, checkIsContractOwnerStarted, checkIsContractOwnerCompleted,
	LOAD_CURRENT_POT, loadCurrentPot, loadCurrentPotStarted, loadCurrentPotCompleted,
	BUY_TICKET, buyTicketStarted, buyTicketCompleted,
} from './actions';

function raiseErrorHandler(action) {
	console.log(action.error.message);
}

function* setWeb3Handler(action) {
	try {
		yield put(setWeb3Completed());
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* setWeb3CompletedHandler(action) {
	try {
		const getAccounts = Promise.promisify(action.web3.eth.getAccounts);
		const accounts = yield call(getAccounts);
		yield all([
			put(setAccounts(accounts)), 
			put(setCurrentAccount(accounts[0])),
			put(loadCurrentPot()),
		]);
	} catch(e) {
		yield put(raiseError(e));
	}
};

function* setCurrentAccountHandler(action) {
	try {
		yield put(setCurrentAccountCompleted(action.account));
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* setCurrentAccountCompletedHandler(action) {
	try {
		yield all([
			put(getCurrentAccountBalance(action.account)),
			put(checkIsContractOwner(action.account)),
		]);
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* getCurrentAccountBalanceHandler(action) {
	try {
		yield put(getCurrentAccountBalanceStarted(action.account));
		const getBalance = Promise.promisify(action.web3.eth.getBalance);
		const balance = yield call(getBalance, action.account);
		yield put(getCurrentAccountBalanceCompleted(action.account, balance.toNumber()));		
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* initiateNewDrawHandler(action) {
	try {
		yield put(initiateNewDrawStarted(action.account));
		const lottery = action.contractsFactory.createLotteryContract();
		
		const newDraw = Promise.promisify(lottery.newDraw);
		//const txHash = yield call(newDraw, { from: action.account, value: 5000000000000000000 });
		const txHash = yield call(newDraw, { from: action.account  });
		const newDrawEvent = lottery.NewDraw();
		newDrawEvent.watch((error, result) => {
			console.log('new draw');
			console.log(error);
			console.log(result);
		});

		const newDrawFailed = lottery.NewDrawFailed();
		newDrawFailed.watch((error, result) => {
			console.log('failed');
			console.log(error);
			console.log(result);
		});

		const allEvents = lottery.allEvents();
		allEvents.watch((error, result) => {
			console.log('all');
			console.log(error);
			console.log(result);
		});

		yield put(initiateNewDrawCompleted(txHash));
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* getCurrentDrawHandler(action) {
	try {
		yield put(getCurrentDrawStarted());
		const lottery = action.contractsFactory.createLotteryContract();
		const currentDraw = Promise.promisify(lottery.currentDraw);
		const draw = yield call(currentDraw);
		yield put(getCurrentDrawCompleted(draw));
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* checkDrawIsOpenHandler(action) {
	try {
		yield put(checkDrawIsOpenStarted());
		const lottery = action.contractsFactory.createLotteryContract();
		const isDrawOpen = Promise.promisify(lottery.isDrawOpen);
		const isOpen = yield call(isDrawOpen);
		yield put(checkDrawIsOpenCompleted(isOpen));
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* checkIsContractOwnerHandler(action) {
	try {
		yield put(checkIsContractOwnerStarted(action.account));
		const lottery = action.contractsFactory.createLotteryContract();
		const isOwner = Promise.promisify(lottery.isOwner);
		const owner = yield call(isOwner, { from: action.account });
		yield put(checkIsContractOwnerCompleted(owner));
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* loadCurrentPotHandler(action) {
	try {
		yield put(loadCurrentPotStarted());
		const lottery = action.contractsFactory.createLotteryContract();
		const getPot = Promise.promisify(lottery.pot);
		const pot = yield call(getPot);
		yield put(loadCurrentPotCompleted(pot.toNumber()));
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* buyTicketHandler(action) {
	try {
		yield put(buyTicketStarted(action.account, action.price, action.numbers));
		const lottery = action.contractsFactory.createLotteryContract();
		const buyTicket = Promise.promisify(lottery.buyTicket);
		const txHash = yield call(buyTicket, action.numbers, { from: action.account, value: action.price });
		yield put(buyTicketCompleted(txHash));
	} catch(e) {
		yield put(raiseError(e));
	}
}

function* saga() {
	yield takeLatest(RAISE_ERROR, raiseErrorHandler);
	yield takeLatest(SET_WEB3, setWeb3Handler);
	yield takeLatest(SET_WEB3_COMPLETED, setWeb3CompletedHandler);
	yield takeLatest(SET_CURRENT_ACCOUNT, setCurrentAccountHandler);
	yield takeLatest(SET_CURRENT_ACCOUNT_COMPLETED, setCurrentAccountCompletedHandler);
	yield takeLatest(GET_CURRENT_ACCOUNT_BALANCE, getCurrentAccountBalanceHandler);
	yield takeLatest(INITIATE_NEW_DRAW, initiateNewDrawHandler);
	yield takeLatest(GET_CURRENT_DRAW, getCurrentDrawHandler);
	yield takeLatest(CHECK_DRAW_IS_OPEN, checkDrawIsOpenHandler);
	yield takeLatest(CHECK_IS_CONTRACT_OWNER, checkIsContractOwnerHandler);
	yield takeLatest(LOAD_CURRENT_POT, loadCurrentPotHandler);
	yield takeLatest(BUY_TICKET, buyTicketHandler);
}

export default saga;
