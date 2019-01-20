SE = {
	CHAIN_ID: 'ssc-00000000000000000002',
	User: null,
	Params: {},
	Tokens: [],

  ShowHomeView: function(view, data) {
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
  },

  ShowDialog: function(dialog, data) {
    $('#dialog_container').html(renderDialog(dialog, data)); 
    $('#dialog_container').modal('show');
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

  ShowTokens: function() { 
		SE.LoadTokens(r => SE.ShowHomeView('tokens', r));
	},
	
	LoadTokens: function(callback) {
		ssc.find('tokens', 'tokens', { }, 1000, 0, [], (err, result) => {
			SE.Tokens = result;      
			
			if(callback)
				callback(result);
    });  
	},

  ShowBalances: function(callback) {
		SE.LoadBalances(r => {
			SE.ShowHomeView('Balances', r);

			if(callback)
				callback(r);
		});   
	},

	LoadParams: function() {
		ssc.findOne('sscstore', 'params', {  }, (err, result) => {
			if(result && !err)
				Object.assign(SE.Params, result);
		});

		ssc.findOne('tokens', 'params', {  }, (err, result) => {
			if(result && !err)
				Object.assign(SE.Params, result);
		});
	},
	
	LoadBalances: function(callback) {
		ssc.find('tokens', 'balances', { account: SE.User.name }, 1000, 0, '', false).then(r => {
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
	
	OnLogin: function(username) {
		SE.ShowLoading();
		SE.User = { name: username };
		SE.LoadParams();
		$("#btnSignIn").hide();
		$("#lnkUsername").text('@' + username);
		$("#ddlLoggedIn").show();

		// Load the steem account info
		steem.api.getAccounts([username], (e, r) => {
			if(r && !e && r.length > 0)
				SE.User.account = r[0];
		});

		SE.LoadTokens(() => SE.ShowBalances(() => SE.HideLoading()));
	},

  LogIn: function(username, key) {
		SE.ShowLoading();

		if(window.steem_keychain && !key) {
			steem_keychain.requestSignBuffer(username, 'Log In', 'Posting', function(response) {
				if(response.error) {
					SE.HideLoading();
					alert('Unable to log in with the @' + username + ' account.');
				} else {
					localStorage.setItem('username', username);
					window.location.reload();
				}
			});
		}	else {
			steem.api.getAccounts([username], function(e, r) {
				if(r && r.length > 0) {
					try {
						if(steem.auth.wifToPublic(key) == r[0].memo_key) {
							localStorage.setItem('username', username);
							localStorage.setItem('key', key);
							window.location.reload();
						} else {
							SE.HideLoading();
							alert('Unable to log in with the @' + username + ' account. Invalid private memo key.');
						}
					} catch(err) { 
						SE.HideLoading();
						alert('Unable to log in with the @' + username + ' account. Invalid private memo key.'); 
					}
				} else {
					alert('There was an error loading the @' + username + ' account.');
				}
			});
		}
  },

  LogOut: function() {    
		localStorage.clear();
		SE.User = null;
    window.location.reload();
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

  RegisterAccount: function() {
    var username = localStorage.getItem('username');

    if(!username) {      
      SE.ShowSignIn();
      return;
    }      

    var registration_data = {
      "contractName": "accounts",
      "contractAction": "register",
      "contractPayload": {}
    };

    if(useKeychain()) {
			SE.ShowLoading();
			    
      steem_keychain.requestCustomJson(username, SE.CHAIN_ID, 'Posting', JSON.stringify(registration_data), 'Steem Engine Account Registration', function(response) {        
        if(response.success) {
					SE.CheckRegistrationStatus(5, 5, () => {
						alert('The account @' + username + ' has been successfully registered!');
						window.location.reload();
					});
        }
        else {
					SE.HideLoading();
				}
      });
    } else {
			SE.SteemConnectJson('posting', registration_data);
			SE.CheckRegistrationStatus(5, 20, () => {
				alert('The account @' + username + ' has been successfully registered!');
				window.location.reload();
			});
		}
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
      steem_keychain.requestCustomJson(username, SE.CHAIN_ID, 'Posting', JSON.stringify(registration_data), 'Steem Engine Token Registration', function(response) {        
        SE.HideLoading()
        if(response.success) {
          alert('Your token, ' + name +', is now created!');
          window.location.reload();
        }
        else
          alert('There was an error publishing this transaction to the Steem blockchain. Please try again in a few minutes.');
      });
    } else {
			SE.SteemConnectJson('active', registration_data);
		}
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
      steem_keychain.requestCustomJson(username, SE.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Token Issue: ' + symbol, function(response) {        
        SE.HideLoading()
        if(response.success) {
          alert(quantity + ' Tokens issued for ' + symbol + ' to @' + to );
          window.location.reload();
        }
        else
          alert('There was an error publishing this transaction to the Steem blockchain. Please try again in a few minutes.');
      });
    } else {
			SE.SteemConnectJson('active', transaction_data);
		}
  },

  SendToken: function(symbol, to, quantity) {
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
        "quantity": quantity
      }
    };

    if(useKeychain()) {    
      steem_keychain.requestCustomJson(username, SE.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Token Issue: ' + symbol, function(response) {        
        SE.HideLoading()
        if(response.success) {
          alert(quantity + ' ' + symbol + ' Tokens sent to @' + to );
          window.location.reload();
        }
        else
          alert('There was an error publishing this transaction to the Steem blockchain. Please try again in a few minutes.');
      });
    } else {
			SE.SteemConnectJson('active', transaction_data);
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
			id: SE.CHAIN_ID,
			json: {
				"contractName": "sscstore",
				"contractAction": "buy",
				"contractPayload": { }
			}
    };

    if(useKeychain()) {    
      steem_keychain.requestTransfer(SE.User.name, 'steemsc', amount.toFixed(3), JSON.stringify(transaction_data), 'STEEM', function(response) {        
        if(response.success) {
					alert('Purchase transaction sent successfully.');
					setTimeout(() => {
						SE.HideLoading();
						SE.ShowBalances();
					}, 5000);
        }
        else {
					SE.HideLoading();
					alert('There was an error publishing this transaction to the Steem blockchain. Please try again in a few minutes.');
				}
      });
    } else {
			SE.HideLoading();
			SE.SteemConnectTransfer(SE.User.name, 'steemsc', amount.toFixed(3) + ' STEEM', JSON.stringify(transaction_data));
		}
	},
	
	SteemConnectJson: function(auth_type, data) {
		var username = localStorage.getItem('username');
		var url = 'https://steemconnect.com/sign/custom-json?';

		url += ((auth_type == 'active') ? 'required_auths' : 'required_posting_auths') + '=' + encodeURI('["' + username + '"]');
		url += '&id=' + SE.CHAIN_ID;
		url += '&json=' + encodeURI(JSON.stringify(data));

		popupCenter(url, 'steemconnect', 500, 560);
	},

	SteemConnectTransfer: function(from, to, amount, memo) {
		var url = 'https://steemconnect.com/sign/transfer?';
		url += '&from=' + encodeURI(from);
		url += '&to=' + encodeURI(to);
		url += '&amount=' + encodeURI(amount);
		url += '&memo=' + encodeURI(memo);

		popupCenter(url, 'steemconnect', 500, 560);
	}
}