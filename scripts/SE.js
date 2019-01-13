SE = {
    
  CHAIN_ID: 'ssc-00000000000000000002',

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
    ssc.find('tokens', 'tokens', { }, 1000, 0, '', false, (err, result) => {
      SE.ShowHomeView('tokens', result);      
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
    SE.ShowDialog('confirm_add_token', {
      "name" : name,
      "symbol" : symbol,
      "precision" : precision,
      "maxSupply" : maxSupply,
      "url" : url,
    });
  },

  LogIn: function() {    
    window.location.reload();
  },

  LogOut: function() {    
    localStorage.clear();
    window.location.reload();
  },

  CheckRegistrationStatus: function(interval = 5, retries = 0, callback) {        
    var username = localStorage.getItem('username');
		console.log('Checking registration status: ' + username);
		
		ssc.findOne('accounts', 'accounts', { id: username }, (err, result) => {            
      if (result) {
        console.log(result, err);        

        if (callback) callback(result);
      } else {
        if (retries < 5) {
          console.log("Retrying...");        
          setTimeout(function() {
            SE.CheckRegistrationStatus(interval, retries + 1, callback);
          }, interval * 1000);
        }
        else {
          alert("Registration not found for @" + username + "\nPlease check again later.");
        }
      }      
    });    
  },

  RegisterAccount: function() {    
    SE.ShowLoading();
    var username = localStorage.getItem('username');

    if(!username) {      
      window.location.reload();
      return;
    }      

    var registration_data = {
      "contractName": "accounts",
      "contractAction": "register",
      "contractPayload": {}
    };

    if(window.steem_keychain) {    
      steem_keychain.requestCustomJson(username, SE.CHAIN_ID, 'Posting', JSON.stringify(registration_data), 'Steem Engine Account Registration', function(response) {        
        SE.HideLoading()
        if(response.success) {
          alert('Your account, ' + username +', is now registered!');
          window.location.reload();
        }
        else
          alert('There was an error publishing this transaction to the Steem blockchain. Please try again in a few minutes.');
      });
    } else {
			SE.SteemConnect('posting', registration_data);
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

    if(window.steem_keychain) {    
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
			SE.SteemConnect('active', registration_data);
		}
	},
	
	SteemConnect: function(auth_type, data) {
		var username = localStorage.getItem('username');
		var url = 'https://steemconnect.com/sign/custom-json?';

		url += ((auth_type == 'active') ? 'required_auths' : 'required_posting_auths') + '=' + encodeURI('["' + username + '"]');
		url += '&id=' + SE.CHAIN_ID;
		url += '&json=' + encodeURI(JSON.stringify(data));

		popupCenter(url, 'steemconnect', 500, 560);
	}
}