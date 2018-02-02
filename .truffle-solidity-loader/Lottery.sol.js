var Web3 = require("web3");
var SolidityEvent = require("web3/lib/web3/event.js");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, instance, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var decodeLogs = function(logs) {
            return logs.map(function(log) {
              var logABI = C.events[log.topics[0]];

              if (logABI == null) {
                return null;
              }

              var decoder = new SolidityEvent(null, logABI, instance.address);
              return decoder.decode(log);
            }).filter(function(log) {
              return log != null;
            });
          };

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  // If they've opted into next gen, return more information.
                  if (C.next_gen == true) {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: decodeLogs(receipt.logs)
                    });
                  } else {
                    return accept(tx);
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], instance, constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("Lottery error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("Lottery error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("Lottery contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of Lottery: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to Lottery.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: Lottery not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "newPrice",
            "type": "uint256"
          }
        ],
        "name": "setTicketPrice",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "organizer",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "numbers",
            "type": "uint256[]"
          }
        ],
        "name": "buyTicket",
        "outputs": [
          {
            "name": "ticketNumber",
            "type": "uint256"
          }
        ],
        "payable": true,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "year",
            "type": "uint256"
          },
          {
            "name": "month",
            "type": "uint256"
          },
          {
            "name": "day",
            "type": "uint256"
          }
        ],
        "name": "newDraw",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "currentDraw",
        "outputs": [
          {
            "name": "isDrawn",
            "type": "bool"
          },
          {
            "name": "isOpen",
            "type": "bool"
          },
          {
            "name": "year",
            "type": "uint256"
          },
          {
            "name": "month",
            "type": "uint256"
          },
          {
            "name": "day",
            "type": "uint256"
          },
          {
            "name": "ticketPrice",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "closeDraw",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "result",
            "type": "uint256[]"
          }
        ],
        "name": "setDrawResult",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "inputs": [],
        "payable": false,
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "BuyTicket",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "year",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "month",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "day",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "pot",
            "type": "uint256"
          }
        ],
        "name": "NewDraw",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x6060604052670de0b6b3a764000060005534610000575b60018054600160a060020a03191633600160a060020a03161790555b5b6111e4806100426000396000f300606060405236156100725763ffffffff60e060020a6000350416631598165081146100775780634ba2363a1461009b57806361203265146100ba578063716cac96146100e35780638efae4a41461014057806397ba287c14610158578063a0eb55701461019a578063c45c2d38146101a9575b610000565b346100005761008760043561020d565b604080519115158252519081900360200190f35b34610000576100a8610237565b60408051918252519081900360200190f35b34610000576100c761023d565b60408051600160a060020a039092168252519081900360200190f35b6100a860048080359060200190820180359060200190808060200260200160405190810160405280939291908181526020018383602002808284375094965061024c95505050505050565b60408051918252519081900360200190f35b3461000057610156600435602435604435610491565b005b3461000057610165610b72565b6040805196151587529415156020870152858501939093526060850191909152608084015260a0830152519081900360c00190f35b3461000057610156610b94565b005b3461000057610087600480803590602001908201803590602001908080602002602001604051908101604052809392919081815260200183836020028082843750949650610bcc95505050505050565b604080519115158252519081900360200190f35b60015460009033600160a060020a03908116911614156102305750600081905560015b5b5b919050565b60025481565b600154600160a060020a031681565b60408051608081018252600080825282516020818101855282825283015291810182905260608101829052600354600190101561028857610000565b600554610100900460ff16151561029e57610000565b60095434146102ac57610000565b6102b583610f4c565b15156102c057610000565b5060408051608081018252600160a060020a033316815260208101849052439181019190915242606082015260028054340190556004805460018101808355828183801582901161038b5760040281600402836000526020600020918201910161038b91905b8082111561036a578054600160a060020a031916815560018101805460008083559182526020822061036e918101905b8082111561036a5760008155600101610356565b5090565b5b50506000600282018190556003820155600401610326565b5090565b5b505050916000526020600020906004020160005b5082518154600160a060020a031916600160a060020a039091161781556020808401518051600184018054828255600082815285902088969592949181019392909101821561040b579160200282015b8281111561040b5782518255916020019190600101906103f0565b5b5061042c9291505b8082111561036a5760008155600101610356565b5090565b505060408281015160028301556060909201516003909101558051600160a060020a033316815234602082015281517f2a3164428cba5dad15f5ffe47e10cbefdcbbe9e269fd482753982ee8b2648c3e93509081900390910190a14391505b50919050565b600154600090819033600160a060020a0390811691161415610b695760035460009011156105145760055460ff1615156105145760025460408051878152602081018790528082018690526060810192909252517fd86123836bc9ef9d977b5a6473215129b9c380e29d699dfb26b4a88e2877716e9181900360800190a1610000565b5b60025460408051878152602081018790528082018690526060810192909252517fd86123836bc9ef9d977b5a6473215129b9c380e29d699dfb26b4a88e2877716e9181900360800190a1600380548091906001018154818355818115116107105760080281600802836000526020600020918201910161071091905b8082111561036a578054600080835582815260208120909161061b9160049091028101905b8082111561036a578054600160a060020a03191681556001810180546000808355918252602082206105fe918101905b8082111561036a5760008155600101610356565b5090565b5b505060006002820181905560038201556004016105b6565b5090565b5b5060018201805461ffff191690556000600283018190556003830181905560048084018290556005840182905560068401805483825590835260209092206106ca929091028101905b8082111561036a578054600160a060020a03191681556001810180546000808355918252602082206106ad918101905b8082111561036a5760008155600101610356565b5090565b5b50506000600282018190556003820155600401610665565b5090565b5b50600782018054600082559060005260206000209081019061070191905b8082111561036a5760008155600101610356565b5090565b5b5050600801610591565b5090565b5b5050509150600360018303815481101561000057906000526020600020906008020160005b506001810180546002830188905560038301879055600480840187905560ff1961ff0019909216610100179190911690915560008054600584015582548254818455918390529293508392829182027f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b908101919085821561087d5760005260206000209160040282015b8281111561087d5782548254600160a060020a031916600160a060020a03909116178255600180840180549184018054838255600082815260209020879487949282019290919082156108355760005260206000209182015b8281111561083557825482559160010191906001019061081a565b5b506108569291505b8082111561036a5760008155600101610356565b5090565b505060028201548160020155600382015481600301555050916004019190600401906107c1565b5b506108eb9291505b8082111561036a578054600160a060020a03191681556001810180546000808355918252602082206108ce918101905b8082111561036a5760008155600101610356565b5090565b5b50506000600282018190556003820155600401610886565b5090565b505060018281018054918301805460ff938416151560ff1990911617808255915461010090819004909316151590920261ff001990911617905560028083015490820155600380830154908201556004808301548183015560058084015490830155600680840180549184018054838255600082815260209020919402810192918215610a3d5760005260206000209160040282015b82811115610a3d5782548254600160a060020a031916600160a060020a03909116178255600180840180549184018054838255600082815260209020879487949282019290919082156109f55760005260206000209182015b828111156109f55782548255916001019190600101906109da565b5b50610a169291505b8082111561036a5760008155600101610356565b5090565b50506002820154816002015560038201548160030155505091600401919060040190610981565b5b50610aab9291505b8082111561036a578054600160a060020a0319168155600181018054600080835591825260208220610a8e918101905b8082111561036a5760008155600101610356565b5090565b5b50506000600282018190556003820155600401610a46565b5090565b50506007820181600701908054828054828255906000526020600020908101928215610af85760005260206000209182015b82811115610af8578254825591600101919060010190610add565b5b50610b199291505b8082111561036a5760008155600101610356565b5090565b505060025460408051898152602081018990528082018890526060810192909252517fd86123836bc9ef9d977b5a6473215129b9c380e29d699dfb26b4a88e2877716e9350908190036080019150a15b5b5b5050505050565b60055460065460075460085460095460ff808616956101009004169392919086565b60015433600160a060020a0390811691161415610bc8576003546001901015610bbc57610000565b6005805461ff00191690555b5b5b565b60015460009081908190819033600160a060020a0390811691161415610f42576003546001901015610bfd57610000565b600554610100900460ff1615610c1257610000565b610c1b85610f4c565b1515610c2657610000565b8451600b8054828255600082905290917f0175b7a638427703f0dbe7bb9bbf987a2551717b34e79f33b5b1008d1fa01db991820191602089018215610c87579160200282015b82811115610c87578251825591602001919060010190610c6c565b5b50610ca89291505b8082111561036a5760008155600101610356565b5090565b5050600092505b600454831015610eb557610d3585600460000185815481101561000057906000526020600020906004020160005b50600101805480602002602001604051908101604052809291908181526020018280548015610d2b57602002820191906000526020600020905b815481526020019060010190808311610d17575b5050505050611025565b15610ea957600a8054600181018083558281838015829011610dd157600402816004028360005260206000209182019101610dd191905b8082111561036a578054600160a060020a0319168155600181018054600080835591825260208220610db4918101905b8082111561036a5760008155600101610356565b5090565b5b50506000600282018190556003820155600401610d6c565b5090565b5b505050916000526020600020906004020160005b60048054879081101561000057906000526020600020906004020160005b5080548354600160a060020a031916600160a060020a0390911617835560018082018054918501805483825560008281526020902094969550909390810192918215610e715760005260206000209182015b82811115610e71578254825591600101919060010190610e56565b5b50610e929291505b8082111561036a5760008155600101610356565b5090565b505060028281015490820155600391820154910155505b5b600190920191610caf565b600a54600254811561000057049150600090505b600a54811015610f2d57600a8054829081101561000057906000526020600020906004020160005b5054604051600160a060020a039091169083156108fc029084906000818181858888f193505050501515610f2457610000565b5b600101610ec9565b6005805460ff19166001179081905560ff1693505b5b5b505050919050565b6000600060068351141515610f64576000915061048b565b610f74836000600186510361107f565b5060005b600581101561101a57610f9e83828151811015610000579060200190602002015161119c565b8015610fc55750610fc583826001018151811015610000579060200190602002015161119c565b5b1515610fd5576000915061048b565b8281600101815181101561000057906020019060200201518382815181101561000057906020019060200201511415611011576000915061048b565b5b600101610f78565b600191505b50919050565b6000805b8351811015611073578281815181101561000057906020019060200201518482815181101561000057602090810290910101511461106a5760009150611078565b5b600101611029565b600191505b5092915050565b818160008560028484030486018151811015610000579060200190602002015190505b81831161116b575b8086848151811015610000579060200190602002015110156110d1576001909201916110aa565b5b8582815181101561000057906020019060200201518110156110fa57600019909101906110d2565b81831161116657858281518110156100005790602001906020020151868481518110156100005790602001906020020151878581518110156100005790602001906020020188858151811015610000576020908102909101019190915252600190920191600019909101905b6110a2565b8185101561117e5761117e86868461107f565b5b838310156111925761119286848661107f565b5b5b505050505050565b6000600182101580156111b05750602a8211155b90505b9190505600a165627a7a72305820e4e75696a88b0ffef560a8169b3b4781ea49cebd8c9163e62fb209e250551fba0029",
    "events": {
      "0x2a3164428cba5dad15f5ffe47e10cbefdcbbe9e269fd482753982ee8b2648c3e": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "BuyTicket",
        "type": "event"
      },
      "0xd86123836bc9ef9d977b5a6473215129b9c380e29d699dfb26b4a88e2877716e": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "year",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "month",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "day",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "pot",
            "type": "uint256"
          }
        ],
        "name": "NewDraw",
        "type": "event"
      }
    },
    "updated_at": 1517620380234,
    "links": {},
    "address": "0x1e3632b15c243ca609439d19edc43344b4ad09cf"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};
    this.events          = this.prototype.events          = network.events || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "function") {
      var contract = name;

      if (contract.address == null) {
        throw new Error("Cannot link contract without an address.");
      }

      Contract.link(contract.contract_name, contract.address);

      // Merge events so this contract knows about library's events
      Object.keys(contract.events).forEach(function(topic) {
        Contract.events[topic] = contract.events[topic];
      });

      return;
    }

    if (typeof name == "object") {
      var obj = name;
      Object.keys(obj).forEach(function(name) {
        var a = obj[name];
        Contract.link(name, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "Lottery";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.2.0";

  // Allow people to opt-in to breaking changes now.
  Contract.next_gen = false;

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.Lottery = Contract;
  }
})();
