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