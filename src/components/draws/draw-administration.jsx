import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { initiateNewDraw } from '../../actions';

import './draw-administration.scss';

export class DrawAdministration extends Component {

  newDraw() {
    this.props.dispatch(initiateNewDraw(this.props.currentAccount.account));
  }

  closeDraw() {

  }

  render() {
    let drawButton = (
      <button
          className="btn btn-primary btn-block mt-2"
          onClick={() => {this.newDraw()}}
        >
          New Draw
        </button>
    );

    if (this.props.draw.isOpen) {
      drawButton = (
        <button
            className="btn btn-danger btn-block mt-2"
            onClick={() => {this.closeDraw()}}
          >
            Close Draw
          </button>
      );
    }

    let currentPot = 0;
    if (typeof this.props.web3.fromWei !== 'undefined') {
      currentPot = this.props.web3.fromWei(this.props.draw.pot, 'ether');
    }

    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Total Pot Price</h5>
          <span className="d-block text-center">{currentPot} ETH</span>
          {drawButton}
        </div>
      </div>
    );
  }
}


DrawAdministration.propTypes = {
  web3: PropTypes.object.isRequired,
  currentAccount: PropTypes.object.isRequired,
  draw: PropTypes.object.isRequired,
};


const mapStateToProps = (state) => {
  return {
    web3: state.settings.web3,
    currentAccount: state.currentAccount,
    draw: state.draw,
  };
};

DrawAdministration = connect(mapStateToProps)(DrawAdministration);

export default DrawAdministration;
