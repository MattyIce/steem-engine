SE = {
	User: null,
	Params: {},
  Tokens: [],

  Api: function(url, data, callback, always) {
    if (data == null || data == undefined) data = {};

    // Add a dummy timestamp parameter to prevent IE from caching the requests.
    data.v = new Date().getTime();

    jQuery
      .getJSON(Config.ACCOUNTS_API_URL + url, data, function(response) {
        if (callback != null && callback != undefined) callback(response);
      })
      .always(function() {
        if (always) always();
      });
  },

  ShowHomeView: function(view, data, url_params) {
		window.scrollTo(0,0);
		$('body').css('overflow', 'auto');
		$('body').css('padding-right', '0');

		$('#page_container').html(render(view, { data: data }));

    SE.LastView = SE.CurrentView;
    SE.CurrentView = { view: view, data: data };

		// Collapse the nav bar hamburger menu on mobile devices
		if(window.innerWidth <= 990) {
			var burger = $('.navbar-toggle');
			if(!burger.hasClass('collapsed'))
				burger.click();
		}

		if(view != 'home') {
			var url = '?p=' + view + (url_params ? '&' + $.param(url_params) : '');

			if(window.location.search == url)
				window.history.replaceState({ data: data, view: view, params: url_params }, 'Steem Engine - Smart Contracts on the STEEM blockchain', url);
			else
				window.history.pushState({ data: data, view: view, params: url_params }, 'Steem Engine - Smart Contracts on the STEEM blockchain', url);
		}
  },

  ShowDialog: function(dialog, data) {
    $('#dialog_container').html(renderDialog(dialog, data));
    $('#dialog_container').modal('show');
	},

	ShowUrlPage(url) {
		var parts = JSON.parse('{"' + decodeURI(url).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');

		if(!parts.p) {
			SE.ShowHome();
			return;
		}

		switch(parts.p) {
			case 'balances':
				SE.ShowBalances(parts.a ? parts.a : SE.User.name);
				break;
			case 'tokens':
				SE.ShowTokens();
				break;
			case 'history':
				if(SE.User || parts.a) {
					SE.LoadBalances(parts.a ? parts.a : SE.User.name, () => {
						if(parts.t && SE.Tokens.find(t => t.symbol == parts.t))
							SE.ShowHistory(parts.t);
						else
							SE.ShowTokens();
					});
				} else
					SE.ShowTokens();
				break;
			case 'add_token':
				SE.ShowAddToken();
				break;
			case 'faq':
				SE.ShowFAQ();
				break;
			case 'market':
				SE.ShowMarket();
				break;
			default:
				SE.ShowHome();
				break;
		}
	},

  HideDialog: function(viewToShowAfter, data) {
    $('#dialog_container').modal('hide');
    if(viewToShowAfter)
      SE.ShowHomeView(viewToShowAfter, data);
  },

  ShowDialogOpaque: function(dialog, data) {
    $('#dialog_container').html(renderDialog(dialog, data));
    $('#dialog_container').modal('show');
    $('.modal-backdrop').addClass('modal-backdrop-opaque');
  },

  ShowHome: function() {
    SE.ShowHomeView('home');
  },

  _loading: null,
  ShowLoading: function() {
    SE._loading = $('<div class="modal-backdrop fade show loading-backdrop" />');
    SE._loading.append(
      $(
        '<img src="https://s3.amazonaws.com/steemmonsters/website/loading.gif" class="loading" />'
      )
    );
    SE._loading.appendTo('body');
  },

  HideLoading: function() {
    SE._loading.remove();
  },

  ShowToast: function(isSuccess, message) {
    var toast = $(renderComponent("toast", {isSuccess : isSuccess, message : message}));
    $('#toast_container').append(toast);
    toast.toast('show');
  },

  ShowTokens: function() {
		SE.LoadTokens(r => SE.ShowHomeView('tokens', r));
	},

	ShowMarket: function() {
		SE.LoadTokens(r => SE.ShowHomeView('market', r));
	},

	ShowMarketView: function(token, precision, account) {
		SE.ShowLoading();
		if(!account && SE.User)
			account = SE.User.name;

		account = 'yabapmatt';

		window.scrollTo(0,0);

		let tasks = [];
		tasks.push(ssc.find('market', 'buyBook', { symbol: token }, 200, 0, [{ index: 'price', descending: true }], false));
		tasks.push(ssc.find('market', 'sellBook', { symbol: token }, 200, 0, [{ index: 'price', descending: false }], false));
		if (account) {
			tasks.push(ssc.find('market', 'buyBook', { symbol: token, account: account }, 100, 0, [{ index: 'timestamp', descending: true }], false));
			tasks.push(ssc.find('market', 'sellBook', { symbol: token, account: account }, 100, 0, [{ index: 'timestamp', descending: true }], false));
		}
		Promise.all(tasks).then(results => {
			let buy_orders = results[0].map(o => {
				o.total = o.quantity * o.price;
				o.amountLocked = o.tokensLocked ? o.tokensLocked * o.price : 0;
				return o;
			});
			let sell_orders = results[1].map(o => {
				o.total = o.quantity * o.price;
				o.amountLocked = o.tokensLocked ? o.tokensLocked * o.price : 0;
				return o;
			});
			let user_buy_orders = results[2].map(o => {
				o.type = 'buy';
				o.total = o.price * o.quantity;
				o.timestamp_string = moment.unix(o.timestamp).format('YYYY-M-DD HH:mm:ss');
				return o;
			});
			let user_sell_orders = results[3].map(o => {
				o.type = 'sell';
				o.total = o.price * o.quantity;
				o.timestamp_string = moment.unix(o.timestamp).format('YYYY-M-DD HH:mm:ss');
				return o;
			});
			let user_orders = user_buy_orders.concat(user_sell_orders);
			user_orders.sort((a, b) => b.timestamp - a.timestamp)

			$('#market_view').html(render('market_view', {
				data: {
					token: token,
					precision: precision,
					buy_orders: buy_orders,
					sell_orders: sell_orders,
					user_orders: user_orders
			 	}
			}));

			SE.HideLoading();
    }, error => {
			SE.HideLoading();
      SE.ShowToast(false, 'Error retrieving market data.');
		});

	},

	LoadTokens: function(callback) {
		ssc.find('tokens', 'tokens', { }, 1000, 0, [], (err, result) => {
			SE.Tokens = result;

			if(callback)
				callback(result);
    });
	},

  ShowBalances: function(account) {
		if(!account && SE.User)
			account = SE.User.name;

		SE.LoadBalances(account, r => {
			SE.ShowHomeView('balances', { balances: r, account: account }, { a: account });
		});
	},

	LoadParams: function(callback) {
		var loaded = 0;

		ssc.findOne('sscstore', 'params', {  }, (err, result) => {
			if(result && !err)
				Object.assign(SE.Params, result);

			if(++loaded >= 2 && callback)
				callback();
		});

		ssc.findOne('tokens', 'params', {  }, (err, result) => {
			if(result && !err)
				Object.assign(SE.Params, result);

			if(++loaded >= 2 && callback)
				callback();
		});
	},

	LoadBalances: function(account, callback) {
		ssc.find('tokens', 'balances', { account: account }, 1000, 0, '', false).then(r => {
			if(SE.User && account == SE.User.name)
				SE.User.balances = r;

			if(callback)
				callback(r);
    });
	},

	GetBalance: function(token) {
		if(SE.User && SE.User.balances) {
			var token = SE.User.balances.find(b => b.symbol == token);
			return token ? token.balance : 0;
		} else
			return 0;
  },

  ShowHistory: function(symbol, name) {
		if(!name)
			name = SE.GetToken(symbol).name;

    SE.Api("/history", { account: SE.User.name, limit: 100, offset: 0, type: 'user', symbol: symbol }, r => {
      SE.ShowHomeView('history', { symbol: symbol, name : name, rows : r }, { t: symbol });
    });
	},

  ShowAbout: function() {
    SE.ShowHomeView('about');
  },

  ShowFAQ: function() {
    SE.ShowHomeView('faq');
  },

  ShowRegister: function() {
    SE.ShowHomeView('register', localStorage.getItem('username'));
  },

  ShowSignIn: function() {
    SE.ShowHomeView('sign_in');
  },

  ShowAddToken: function() {
    SE.ShowHomeView('add_token');
  },

  ShowConfirmAddToken: function(name, symbol, precision, maxSupply, url) {
    SE.ShowDialogOpaque('confirm_add_token', {
      "name" : name,
      "symbol" : symbol,
      "precision" : precision,
      "maxSupply" : maxSupply,
      "url" : url,
    });
	},

	OnLogin: function(username, callback) {
		SE.ShowLoading();
		SE.User = { name: username };
		$("#btnSignIn").hide();
		$("#lnkUsername").text('@' + username);
		$("#ddlLoggedIn").show();
		$('#nav_wallet').show();

		// Load the steem account info
		steem.api.getAccounts([username], (e, r) => {
			if(r && !e && r.length > 0)
				SE.User.account = r[0];
		});

		if(callback)
			callback(SE.User);
	},

  LogIn: function(username, key) {
		SE.ShowLoading();

		if(window.steem_keychain && !key) {
			steem_keychain.requestSignBuffer(username, 'Log In', 'Posting', function(response) {
				if(response.error) {
          SE.HideLoading();
          SE.ShowToast(false, 'Unable to log in with the @' + username + ' account.');
				} else {
					localStorage.setItem('username', username);
					window.location.reload();
				}
			});
		}	else {
			try {
				if (key && !steem.auth.isWif(key)) {
					key = steem.auth.getPrivateKeys(username, key, ['posting']).posting;
				}
			} catch(err) {
        SE.ShowToast(false, 'Invalid private key or master password.');
				return;
			}

			steem.api.getAccounts([username], function(e, r) {
				if(r && r.length > 0) {
					try {
						if(steem.auth.wifToPublic(key) == r[0].memo_key || steem.auth.wifToPublic(key) == r[0].posting.key_auths[0][0]) {
							localStorage.setItem('username', username);
							localStorage.setItem('key', key);
							window.location.reload();
						} else {
              SE.HideLoading();
              SE.ShowToast(false, 'Unable to log in with the @' + username + ' account. Invalid private key or password.');
						}
					} catch(err) {
            SE.HideLoading();
            SE.ShowToast(false, 'Unable to log in with the @' + username + ' account. Invalid private key or password.');
					}
				} else {
          SE.ShowToast(false, 'There was an error loading the @' + username + ' account.');
				}
			});
		}
  },

  LogOut: function() {
		localStorage.clear();
		SE.User = null;
    window.location.href = window.location.origin;
	},

	CheckRegistration: function(username, callback) {
		ssc.findOne('accounts', 'accounts', { id: username }, (err, result) => { if (callback) callback(result); });
	},

  CheckRegistrationStatus: function(interval = 5, retries = 5, callback) {
    var username = localStorage.getItem('username');
		console.log('Checking registration status: ' + username);

		SE.CheckRegistration(username, r => {
			if(r) {
				if(callback) callback(r);
			} else {
				if (retries > 0) {
          console.log("Retrying...");
          setTimeout(function() {
            SE.CheckRegistrationStatus(interval, retries - 1, callback);
          }, interval * 1000);
        }
        else {
          //alert("Registration not found for @" + username + "\nPlease check again later.");
        }
			}
		});
  },

  RegisterToken: function(name, symbol, precision, maxSupply, url) {
    SE.ShowLoading();
    var username = localStorage.getItem('username');

    if(!username) {
      window.location.reload();
      return;
    }

    var registration_data = {
      "contractName": "tokens",
      "contractAction": "create",
      "contractPayload": {
        "symbol": symbol,
        "name": name,
        "url": url,
        "precision": precision,
        "maxSupply": maxSupply
    }
    };

    if(useKeychain()) {
      steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(registration_data), 'Steem Engine Token Registration', function(response) {
        if(response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
            if(tx.success)
              SE.ShowToast(true, 'Token created successfully!');
            else
              SE.ShowToast(false, 'An error occurred creating your token: ' + tx.error);

						SE.HideLoading();
						SE.HideDialog();
						SE.LoadTokens(() => SE.ShowHistory(symbol));
					});
        }
        else
					SE.HideLoading()
      });
    } else {
			SE.SteemConnectJson('active', registration_data, () => {
				SE.LoadTokens(() => SE.ShowHistory(symbol));
			});
		}
  },

  ShowIssueTokenDialog: function(symbol, balance) {
    SE.ShowDialog('issue_token', { symbol : symbol, balance : balance });
  },

  IssueToken: function(symbol, to, quantity) {
    SE.ShowLoading();
    var username = localStorage.getItem('username');

    if(!username) {
      window.location.reload();
      return;
    }

    var transaction_data = {
      "contractName": "tokens",
      "contractAction": "issue",
      "contractPayload": {
        "symbol": symbol,
        "to": to,
        "quantity": quantity
      }
    };

    if(useKeychain()) {
      steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Token Issue: ' + symbol, function(response) {
        if(response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
            if(tx.success)
              SE.ShowToast(true, quantity + ' ' + symbol + ' tokens issued to @' + to);
            else
              SE.ShowToast(false, 'An error occurred issuing tokens: ' + tx.error);

						SE.HideLoading();
						SE.HideDialog();
						SE.LoadTokens(() => SE.LoadBalances(SE.User.name, () => SE.ShowHistory(symbol)));
					});
        }
        else
					SE.HideLoading();
      });
    } else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.LoadTokens(() => SE.LoadBalances(SE.User.name, () => SE.ShowHistory(symbol)));
			});
		}
  },

  ShowSendTokenDialog: function(symbol, balance) {
    SE.ShowDialog('send_token', { symbol : symbol, balance : balance });
  },

  SendToken: function(symbol, to, quantity, memo) {
    SE.ShowLoading();
    var username = localStorage.getItem('username');

    if(!username) {
      window.location.reload();
      return;
    }

    var transaction_data = {
      "contractName": "tokens",
      "contractAction": "transfer",
      "contractPayload": {
        "symbol": symbol,
        "to": to,
				"quantity": quantity,
				"memo": memo
      }
    };

		console.log('SENDING: ' + symbol);

    if(useKeychain()) {
      steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Token Transfer: ' + symbol, function(response) {
        if(response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
            if(tx.success)
              SE.ShowToast(true, quantity + ' ' + symbol + ' Tokens sent to @' + to )
            else
              SE.ShowToast(false, 'An error occurred submitting the transfer: ' + tx.error)

						SE.HideLoading();
						SE.HideDialog();
						SE.LoadBalances(SE.User.name, () => SE.ShowHistory(symbol));
					});
        }
        else
					SE.HideLoading();
      });
    } else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.LoadBalances(SE.User.name, () => SE.ShowHistory(symbol));
			});
		}
  },

  ShowBuySSC: function() {
    SE.ShowDialog('buy_ssc', null);
	},

	BuySSC: function(amount) {
		SE.ShowLoading();

    if(!SE.User) {
      window.location.reload();
      return;
    }

    var transaction_data = {
			id: Config.CHAIN_ID,
			json: {
				"contractName": "sscstore",
				"contractAction": "buy",
				"contractPayload": { }
			}
    };

    if(useKeychain()) {
      steem_keychain.requestTransfer(SE.User.name, 'steemsc', amount.toFixed(3), JSON.stringify(transaction_data), 'STEEM', function(response) {
        if(response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if(tx.success) {
              SE.ShowToast(true, 'Purchase transaction sent successfully.');
							SE.HideLoading();
							SE.HideDialog();
							SE.LoadBalances(SE.User.name, () => SE.ShowHistory(Config.NATIVE_TOKEN, 'Steem Engine Tokens'));
            } else
              SE.ShowToast(false, 'An error occurred purchasing SSC: ' + tx.error);
					});
        }
        else
					SE.HideLoading();
      });
    } else {
			SE.HideLoading();
			SE.SteemConnectTransfer(SE.User.name, 'steemsc', amount.toFixed(3) + ' STEEM', JSON.stringify(transaction_data), () => {
				SE.LoadBalances(SE.User.name, () => SE.ShowHistory(Config.NATIVE_TOKEN, 'Steem Engine Tokens'));
			});
		}
  },

  ShowTransactionDialog: function(data) {
		SE.ShowDialog('transaction', data);
	},

	_sc_callback: null,
	SteemConnectJson: function(auth_type, data, callback) {
		SE.HideLoading();
		SE.ShowDialog('steem_connect')

		var username = localStorage.getItem('username');
		var url = 'https://steemconnect.com/sign/custom-json?';

		if(auth_type == 'active') {
			url += 'required_posting_auths=' + encodeURI('[]');
			url += '&required_auths=' + encodeURI('["' + username + '"]');
		} else
			url += 'required_posting_auths=' + encodeURI('["' + username + '"]');

		url += '&id=' + Config.CHAIN_ID;
		url += '&json=' + encodeURI(JSON.stringify(data));

		popupCenter(url, 'steemconnect', 500, 560);
		SE._sc_callback = callback;
	},

	SteemConnectTransfer: function(from, to, amount, memo, callback) {
		SE.HideLoading();
		SE.ShowDialog('steem_connect')

		var url = 'https://steemconnect.com/sign/transfer?';
		url += '&from=' + encodeURI(from);
		url += '&to=' + encodeURI(to);
		url += '&amount=' + encodeURI(amount);
		url += '&memo=' + encodeURI(memo);

		popupCenter(url, 'steemconnect', 500, 560);
		SE._sc_callback = callback;
	},

	SteemConnectCallback: function() {
		if(SE._sc_callback) {
			SE.ShowLoading();

			setTimeout(() => {
				SE.HideLoading();
				SE._sc_callback();
				SE._sc_callback = null;
			}, 10000);
		}
	},

	CheckAccount: function(name, callback) {
		steem.api.getAccounts([name], (e, r) => {
			if(r && r.length > 0)
				callback(r[0]);
			else
				callback(null);
		});
	},

	CheckTransaction(trx_id, retries, callback) {
		ssc.getTransactionInfo(trx_id, (err, result) => {
			if(result) {
				var error = null;

				if(result.logs) {
					var logs = JSON.parse(result.logs);

					if(logs.errors && logs.errors.length > 0)
						error = logs.errors[0];
				}

				if(callback)
					callback(Object.assign(result, { error: error, success: !error }));
			} else if(retries > 0)
				setTimeout(() => SE.CheckTransaction(trx_id, retries - 1, callback), 5000);
			else if(callback)
				callback({ success: false, error: 'Transaction not found.' });
		});
	},

	GetToken: function(symbol) { return SE.Tokens.find(t => t.symbol == symbol); }
}