export const RAISE_ERROR = 'RAISE_ERROR';

export const raiseError = (error) => {
	return {
		type: RAISE_ERROR,
		error,
	};
};

export const SET_WEB3 = 'SET_WEB3';
export const SET_WEB3_COMPLETED = 'SET_WEB3_COMPLETED';

export const setWeb3 = () => {
	return {
		type: SET_WEB3,
	};
};

export const setWeb3Completed = () => {
	return {
		type: SET_WEB3_COMPLETED,
	};
};

export const SET_ACCOUNTS = 'SET_ACCOUNTS';

export const setAccounts = (accounts) => {
	return {
		type: SET_ACCOUNTS,
		accounts,
	}
};

export const SET_CURRENT_ACCOUNT = 'SET_CURRENT_ACCOUNT';
export const SET_CURRENT_ACCOUNT_COMPLETED = 'SET_CURRENT_ACCOUNT_COMPLETED';

export const setCurrentAccount = (account) => {
	return {
		type: SET_CURRENT_ACCOUNT,
		account,
	};
};

export const setCurrentAccountCompleted = (account) => {
	return {
		type: SET_CURRENT_ACCOUNT_COMPLETED,
		account,
	};
};

export const GET_CURRENT_ACCOUNT_BALANCE = 'GET_CURRENT_ACCOUNT_BALANCE';
export const GET_CURRENT_ACCOUNT_BALANCE_STARTED = 'GET_CURRENT_ACCOUNT_BALANCE_STARTED';
export const GET_CURRENT_ACCOUNT_BALANCE_COMPLETED = 'GET_CURRENT_ACCOUNT_BALANCE_COMPLETED';

export const getCurrentAccountBalance = (account) => {
	return {
		type: GET_CURRENT_ACCOUNT_BALANCE,
		account,
	};
};

export const getCurrentAccountBalanceStarted = (account) => {
	return {
		type: GET_CURRENT_ACCOUNT_BALANCE_STARTED,
		account,
	};
};

export const getCurrentAccountBalanceCompleted = (account, balance) => {
	return {
		type: GET_CURRENT_ACCOUNT_BALANCE_COMPLETED,
		account,
		balance,
	}
}

export const INITIATE_NEW_DRAW = 'INITIATE_NEW_DRAW';
export const INITIATE_NEW_DRAW_STARTED = 'INITIATE_NEW_DRAW_STARTED';
export const INITIATE_NEW_DRAW_COMPLETED = 'INITIATE_NEW_DRAW_COMPLETED';

export const initiateNewDraw = (account) => {
	return {
		type: INITIATE_NEW_DRAW,
		account,
	};
};

export const initiateNewDrawStarted = (account) => {
	return {
		type: INITIATE_NEW_DRAW_STARTED,
		account,
	};
};

export const initiateNewDrawCompleted = (transactionHash) => {
	return {
		type: INITIATE_NEW_DRAW_COMPLETED,
		transactionHash,
	};
};

export const GET_CURRENT_DRAW = 'GET_CURRENT_DRAW';
export const GET_CURRENT_DRAW_STARTED = 'GET_CURRENT_DRAW_STARTED';
export const GET_CURRENT_DRAW_COMPLETED = 'GET_CURRENT_DRAW_COMPLETED';

export const getCurrentDraw = () => {
	return {
		type: GET_CURRENT_DRAW,
	};
};

export const getCurrentDrawStarted = () => {
	return {
		type: GET_CURRENT_DRAW_STARTED,
	};
};

export const getCurrentDrawCompleted = (draw) => {
	return {
		type: GET_CURRENT_DRAW_COMPLETED,
		draw,
	};
}

export const CHECK_DRAW_IS_OPEN = 'CHECK_DRAW_IS_OPEN';
export const CHECK_DRAW_IS_OPEN_STARTED = 'CHECK_DRAW_IS_OPEN_STARTED';
export const CHECK_DRAW_IS_OPEN_COMPLETED = 'CHECK_DRAW_IS_OPEN_COMPLETED';

export const checkDrawIsOpen = () => {
	return {
		type: CHECK_DRAW_IS_OPEN,
	};
};

export const checkDrawIsOpenStarted = () => {
	return {
		type: CHECK_DRAW_IS_OPEN_STARTED,
	};
};

export const checkDrawIsOpenCompleted = (isOpen) => {
	return {
		type: CHECK_DRAW_IS_OPEN_COMPLETED,
		isOpen,
	};
};

export const CHECK_IS_CONTRACT_OWNER = 'CHECK_IS_CONTRACT_OWNER';
export const CHECK_IS_CONTRACT_OWNER_STARTED = 'CHECK_IS_CONTRACT_OWNER_STARTED';
export const CHECK_IS_CONTRACT_OWNER_COMPLETED = 'CHECK_IS_CONTRACT_OWNER_COMPLETED';

export const checkIsContractOwner = (account) => {
	return {
		type: CHECK_IS_CONTRACT_OWNER,
		account,
	};
};

export const checkIsContractOwnerStarted = (account) => {
	return {
		type: CHECK_IS_CONTRACT_OWNER_STARTED,
		account,
	};
};

export const checkIsContractOwnerCompleted = (isOwner) => {
	return {
		type: CHECK_IS_CONTRACT_OWNER_COMPLETED,
		isOwner,
	};
};

export const LOAD_CURRENT_POT = 'LOAD_CURRENT_POT';
export const LOAD_CURRENT_POT_STARTED = 'LOAD_CURRENT_POT_STARTED';
export const LOAD_CURRENT_POT_COMPLETED = 'LOAD_CURRENT_POT_COMPLETED';

export const loadCurrentPot = () => {
	return {
		type: LOAD_CURRENT_POT,
	};
};

export const loadCurrentPotStarted = () => {
	return {
		type: LOAD_CURRENT_POT_STARTED,
	};
};

export const loadCurrentPotCompleted = (pot) => {
	return {
		type: LOAD_CURRENT_POT_COMPLETED,
		pot,
	};
};

export const BUY_TICKET = 'BUY_TICKET';
export const BUY_TICKET_STARTED = 'BUY_TICKET_STARTED';
export const BUY_TICKET_COMPLETED = 'BUY_TICKET_COMPLETED';

export const buyTicket = (account, price, numbers) => {
	return {
		type: BUY_TICKET,
		account,
		price,
		numbers,
	};
};

export const buyTicketStarted = (account, price, numbers) => {
	return {
		type: BUY_TICKET_STARTED,
		account,
		price,
		numbers,
	};
};

export const buyTicketCompleted = (transactionHash) => {
	return {
		type: BUY_TICKET_COMPLETED,
		transactionHash,
	};
};

		
