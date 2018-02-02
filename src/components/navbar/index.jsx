import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import FavIcon from '../../../public/favicon.ico';

import { setCurrentAccount, loadCurrentPot, getCurrentAccountBalance } from '../../actions';

import './index.scss';

export class NavBar extends Component {
	constructor(props, dispatch) {
		super(props);
	}

	componentDidMount() {
		setInterval(() => {
			this.props.dispatch(loadCurrentPot());
			this.props.dispatch(getCurrentAccountBalance(this.props.currentAccount.account));
		}, 10000)
	}

	changeAccount(account) {
		this.props.dispatch(setCurrentAccount(account));
	}

	render() {
		let balance = 0;
		let currentPot = 0;
		if (typeof this.props.web3.fromWei !== 'undefined') {
			balance = this.props.web3.fromWei(this.props.currentAccount.balance, 'ether');
			currentPot = this.props.web3.fromWei(this.props.pot, 'ether');
		}

		return (
			<nav className="navbar navbar-expand-lg navbar-light bg-light">
				<Link className="navbar-brand" to="/">
					<img src={FavIcon} alt="lotto 6/42" />&nbsp;
					Lotto 6-42
				</Link>
			  <div className="navbar-brand ml-3 mr-auto">
			  		Current Pot Price: <span className="pot-price font-weight-bold mr-3">{currentPot} ETH</span>
			  </div>
			  <button
					className="navbar-toggler"
					type="button"
					data-toggle="collapse"
					data-target="#navbarTogglerDemo02"
					aria-controls="navbarTogglerDemo02"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
			    <span className="navbar-toggler-icon"></span>
			  </button>
			  <div className="collapse navbar-collapse ml-3" id="navbarTogglerDemo02">
			  	<ul className="navbar-nav mr-auto mt-2 mt-lg-0">
			      <li className="nav-item d-none">
			      	<Link className="nav-link" to="/">{this.props.isOwner ? 'Draws' : 'Tickets'}</Link>
			      </li>
			    </ul>
			    <ul className="navbar-nav">
			    	<li className="nav-item dropdown mr-3">
			    		<label className="mr-3">Account</label>
			    		<button
						  	className="btn btn-success btn-sm dropdown-toggle"
						  	type="button"
						  	id="accountDropdownMenuButton"
						  	data-toggle="dropdown"
						  	aria-haspopup="true"
						  	aria-expanded="false"
						  >
						    {this.props.currentAccount.account}
						  </button>
						  <div
						  	className="dropdown-menu dropdown-menu-right"
						  	aria-labelledby="accountDropdownMenuButton"
						  >
						  	{
						  		this.props.accounts.map((a, i) => 
						  		(
						  			<button
						  				key={`account-${i}`}
						  				className="btn dropdown-item"
						  				onClick={() => this.changeAccount(a)}
						  			>
						  				{a}
						  			</button>
						  		))
						  	}
						  </div>
			    	</li>
			    	<li className="nav-item">
			    		<label className="mr-3">Balance</label>
			    		<span>{balance} ETH</span>
			    	</li>
			    </ul>
			  </div>
			</nav>
		);
	}
}

NavBar.propTypes = {
	web3: PropTypes.object.isRequired,
	currentAccount: PropTypes.object.isRequired,
	accounts: PropTypes.array.isRequired,
	pot: PropTypes.number.isRequired,
	isOwner: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => {
	return {
		web3: state.settings.web3,
		currentAccount: state.currentAccount,
		accounts: state.accounts,
		pot: state.draw.pot,
		isOwner: state.settings.isOwner,
	};
};

NavBar = connect(mapStateToProps)(NavBar);

export default NavBar;
