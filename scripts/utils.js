_.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;
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

function useKeychain() { return window.steem_keychain && !localStorage.getItem('key'); }

function addCommas(nStr, currency) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : ''
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}

	if (x2 == '' && currency == 1)
			x2 = '.00';

	return x1 + x2;
}

function loadSteemPrice(callback) {
	$.get('https://postpromoter.net/api/prices', function (data) {
		window.steem_price = parseFloat(data.steem_price);

		if(callback)
			callback(window.steem_price);
	});
}

function usdFormat(val, decimal_limit) {
	var usd = val * window.steem_price;

	if(decimal_limit && !isNaN(parseInt(decimal_limit)))
		return '$' + addCommas(usd.toFixed(decimal_limit));
	else if(usd >= 1000)
		return '$' + addCommas(usd.toFixed());
	else if(usd >= 1)
		return '$' + addCommas(usd.toFixed(2));
	else if(usd >= 0.1)
		return '$' + usd.toFixed(3);
	else
		return '$' + usd.toFixed(5);
}

function tryParse(json) {
	try {
		return JSON.parse(json);
	} catch(err) { return null; }
}

function largeNumber(val) {
	val = parseFloat(val);
	
	if(val >= 1000000000000)
		return addCommas(+(val / 1000000000000).toFixed(0)) + ' T';
	else if(val >= 1000000000)
		return addCommas(+(val / 1000000000).toFixed(3)) + ' B';
	else if(val >= 1000000)
		return addCommas(+(val / 1000000).toFixed(3)) + ' M';
	else
		return addCommas(+val.toFixed(3));
}

function xss(text) {
  text = filterXSS(text);

  while(text.match(/onload/gi))
		text = text.replace(/onload/gi, '');

	while(text.match(/onerror/gi))
		text = text.replace(/onerror/gi, '');

	while(text.match(/javascript/gi))
		text = text.replace(/javascript/gi, '');

	while(text.match(/&#/gi))
    text = text.replace(/&#/gi, '');
    
  return text;
}

// Ref: https://helloacm.com/javascripts-tofixed-implementation-without-rounding/
// make 3 digits without rounding e.g. 3.1499 => 3.149 and 3.1 => 3.100
Number.prototype.toFixedNoRounding = function(n) {
    const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g")
    const a = this.toString().match(reg)[0];
    const dot = a.indexOf(".");
    if (dot === -1) { // integer, insert decimal dot and pad up zeros
        return a + "." + "0".repeat(n);
    }
    const b = n - (a.length - dot) + 1;
    return b > 0 ? (a + "0".repeat(b)) : a;
 }
