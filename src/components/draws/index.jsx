import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DrawAdministration from './draw-administration';
import { checkDrawIsOpen } from '../../actions';

import './index.scss';

export class Draws extends Component {
	
	componentDidMount() {
		this.props.dispatch(checkDrawIsOpen());
	}

	render() {
		let currentPot = 0;
		if (typeof this.props.web3.fromWei !== 'undefined') {
			currentPot = this.props.web3.fromWei(this.props.draw.pot, 'ether');
		}

		return (
			<div className="container-fluid mt-3">
				<div className="col-md-3">
					{
						this.props.isOwner ? (
							<DrawAdministration />
						) : (
							<div className="card">
				        <div className="card-body">
				          <h5 className="card-title">Total Pot Price</h5>
				          <span className="d-block text-center">{currentPot} ETH</span>
				        </div>
				      </div>
						)
					}
				</div>
			</div>
		);
	}
}

Draws.propTypes = {
	web3: PropTypes.object.isRequired,
	currentAccount: PropTypes.object.isRequired,
	draw: PropTypes.object.isRequired,
	isOwner: PropTypes.bool.isRequired,
};


const mapStateToProps = (state) => {
	return {
		web3: state.settings.web3,
		currentAccount: state.currentAccount,
		draw: state.draw,
		isOwner: state.settings.isOwner,
	};
};

Draws = connect(mapStateToProps)(Draws);

export default Draws;
