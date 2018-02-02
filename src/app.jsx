import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Provider } from 'react-redux'
import createHistory from 'history/createBrowserHistory'

import AppRoutes from './app-routes';
import { createStore } from './store';
import { setWeb3 } from './actions';

import './app.scss';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.history = createHistory();
    this.store = createStore(this.history, this.props.web3);
  }

  componentDidMount() {
    this.store.dispatch(setWeb3());
  }

  render() {
    return (
      <div className="app">
        <Provider store={this.store}>
          <AppRoutes history={this.history} />
        </Provider>
      </div>
    );
  }
}

App.propTypes = {
  web3: PropTypes.object.isRequired,
};
