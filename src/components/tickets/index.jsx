import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Ticket from './ticket';

import './index.scss';

export class Tickets extends Component {
	render() {
		return (
			<div className="container-fluid">
				<div className="row">
					<div className="col-md-4 pt-3">
						<Ticket />
					</div>
				</div>
			</div>
		);
	}
}

Tickets.propTypes = {
  web3: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
	return {
		web3: state.settings.web3,
	};
};

Tickets = connect(mapStateToProps)(Tickets);

export default Tickets;
