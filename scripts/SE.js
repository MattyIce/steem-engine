SE = {
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
    SE.ShowHomeView('register');
  },

  ShowSignIn: function() {    
    SE.ShowHomeView('sign_in');
  },
}