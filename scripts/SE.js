SE = {
  
  chain_id: 'ssc-00000000000000000001',

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

  ShowHome: function() {    
    SE.ShowHomeView('home');
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

  LogIn: function() {    
    window.location.reload();
  },

  LogOut: function() {    
    localStorage.clear();
    window.location.reload();
  },

  RegisterAccount: function() {    
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

    // if(window.steem_keychain) {    
    //   steem_keychain.requestCustomJson(username, SE.chain_id, 'Posting', JSON.stringify(registration_data), 'Steem Engine Registration', function(response) {        
    //     if(response.success) 
    //       alert('Yay it worked!');
    //     else
    //       alert('Something broke.');
    //   });
    // }
  },
}