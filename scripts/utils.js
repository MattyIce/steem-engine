function render(tmpl_name, tmpl_data) {
  if (!render.tmpl_cache) {
      render.tmpl_cache = {};
  }

  if (!render.tmpl_cache[tmpl_name]) {
      var tmpl_dir = 'views';
      var tmpl_url = tmpl_dir + '/' + tmpl_name + '.html';

      var tmpl_string;
      $.ajax({
          url: tmpl_url,
          method: 'GET',
          async: false,
          cache: false,
          success: function (data) {
              tmpl_string = data;
          }
      });

      render.tmpl_cache[tmpl_name] = _.template(tmpl_string);
  }

  return render.tmpl_cache[tmpl_name](tmpl_data);
}

function renderComponent(component, data) {
  return render('/components/' + component, { data: data });
}

function renderDialog(component, data) {
  return render('/dialogs/' + component, { data: data });
}

function popupCenter(url, title, w, h) {
	// Fixes dual-screen position                         Most browsers      Firefox
	var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
	var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

	var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
	var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

	var left = ((width / 2) - (w / 2)) + dualScreenLeft;
	var top = ((height / 2) - (h / 2)) + dualScreenTop;
	var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

	// Puts focus on the newWindow
	if (window.focus) {
			newWindow.focus();
	}

	return newWindow;
}