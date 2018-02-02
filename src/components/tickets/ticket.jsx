import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { buyTicket } from '../../actions';

class Ticket extends Component {
	constructor(props) {
		super(props);

    this.state = {
      checkCount: 0,
      numbers: [],
      confirmBuy: false,
    };

    for(let i = 0; i < 42; i++) {
      this.state.numbers.push({
        value: i + 1,
        display: i + 1,
        index: i,
        checked: false,
      });
    }

    this.onCheckChange = this.onCheckChange.bind(this);
	}

  onCheckChange(e) {
    if (this.state.checkCount > 5 && e.target.checked) {
      return;
    }

    const idx = e.target.getAttribute('data-idx');
    const state = Object.assign({}, this.state);

    state.numbers[idx].checked = e.target.checked;

    if (e.target.checked) {
      state.checkCount++;
    } else {
      state.checkCount--;
    }
    
    this.setState(state);
  }

  buy() {
    if (this.state.checkCount !== 6) {
      return;
    }

    this.setState({
      confirmBuy: true,
    });
  }

  buyCancel() {
    this.setState({
      confirmBuy: false,
    });
  }

  buyConfirm() {
    const selectedNumbers = this.state.numbers.filter(n => n.checked);
    const numbers = [];
    for(let i = 0; i < selectedNumbers.length; i++) {
      numbers.push(selectedNumbers[i].value);
    }
    this.props.dispatch(buyTicket(this.props.currentAccount.account, this.props.ticketPrice, numbers));

    // const state = {
    //   checkCount: 0,
    //   numbers: [],
    //   confirmBuy: false,
    // };

    // for(let i = 0; i < 42; i++) {
    //   state.numbers.push({
    //     value: i + 1,
    //     display: i + 1,
    //     index: i,
    //     checked: false,
    //   });
    // }

    // this.setState(state);
  }

	render() {
    let ticketPrice = 0;
    if (typeof this.props.web3.fromWei !== 'undefined') {
      ticketPrice = this.props.web3.fromWei(this.props.ticketPrice, 'ether');
    }

		return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Ticket</h5>
          <div>
            <label className="mr-3">Number Count:</label>
            <span className="font-weight-bold">{this.state.checkCount} / 6</span>
          </div>
          <div>
            <label className="mr-3">Ticket Price:</label>
            <span className="font-weight-bold">{ticketPrice} ETH</span>
          </div>
          {
            this.state.numbers.map((n, i) => (
              <CheckControl
                key={`ticket-number-${n.value}`}
                number={n}
                onCheckChange={this.onCheckChange}
              />
            ))
          } 
        </div>
        <div className="card-footer">
          {
            this.state.confirmBuy ? (
              <div className="text-right">
                <button
                  className="btn btn-success mr-2"
                  onClick={() => this.buyConfirm()}
                >
                  Confirm
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => this.buyCancel()}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-block"
                onClick={() => this.buy()}
                disabled={this.state.checkCount !== 6}
              >
                Buy Ticket
              </button>
            )
          }
        </div>
      </div>
		);
	}
}

function CheckControl(props) {
  return (
    <div
      className="col-2 form-check form-check-inline"
    >
      <input
        className="form-check-input" 
        type="checkbox"
        value={props.number.value}
        onChange={props.onCheckChange}
        id={`chk-ticket-${props.number.value}`}
        data-idx={props.number.index}
        checked={props.number.checked}
      />
      <label
        className="form-check-label"
        htmlFor={`chk-ticket-${props.number.value}`}
      >
        {props.number.display}
      </label>
    </div>
  )
}

Ticket.propTypes = {
  web3: PropTypes.object.isRequired,
  ticketPrice: PropTypes.number.isRequired,
  currentAccount: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  return {
    web3: state.settings.web3,
    ticketPrice: state.draw.ticketPrice,
    currentAccount: state.currentAccount,
  };
};

Ticket = connect(mapStateToProps)(Ticket);

export default Ticket;
