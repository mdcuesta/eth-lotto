import React from 'react';
import ReactDOM from 'react-dom';
import Web3 from 'web3';
import './index.scss';
import App from './app';
import registerServiceWorker from './registerServiceWorker';

import truffleConfig from '../truffle.js'

var web3Location = `http://${truffleConfig.rpc.host}:${truffleConfig.rpc.port}`

window.addEventListener('load', function() {    
	let web3Provided = null;         
  // Supports Metamask and Mist, and other wallets that provide 'web3'.      
  if (typeof web3 !== 'undefined') {                            
    // Use the Mist/wallet provider.                            
    //web3Provided = new Web3(new Web3.providers.HttpProvider(web3Location));
    web3Provided = new Web3(window.web3.currentProvider);
  } else {    
    web3Provided = new Web3(new Web3.providers.HttpProvider(web3Location));
  }                                                                                                                       

  ReactDOM.render(<App web3={web3Provided} />, document.getElementById('root'));
	registerServiceWorker();
});