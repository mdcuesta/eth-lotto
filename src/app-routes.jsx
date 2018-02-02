import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Route } from 'react-router'
import { ConnectedRouter } from 'react-router-redux'

import NavBar from './components/navbar';
import Tickets from './components/tickets';
import Draws from './components/draws';

export class AppRoutes extends Component {
  render() {
    let page = Tickets;
    if (this.props.isOwner) {
      page = Draws;
    }
    
    return (
      <ConnectedRouter history={this.props.history}>
        <div>
          <header className="app-header">
            <NavBar />
          </header>
          <Route
            exact
            path="/"
            component={page}
          />
        </div>
      </ConnectedRouter>
    );
  }
}

AppRoutes.propTypes = {
  web3: PropTypes.object.isRequired,
  isOwner: PropTypes.bool.isRequired,
  history: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  return {
    web3: state.settings.web3,
    isOwner: state.settings.isOwner,
  };
};

AppRoutes = connect(mapStateToProps)(AppRoutes);

export default AppRoutes;
