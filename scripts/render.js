$(function () {
    var username = localStorage.getItem('username');
    SE.LoadParams(() => {
        SE.LoadTokens(() => {
            if (username) {
                SE.OnLogin(username, () => {
                    if (window.location.search)
                        SE.ShowUrlPage(window.location.search.substr(1));
                    else
                        SE.ShowBalances(username);

                    SE.HideLoading();
                });
            } else if (window.location.search)
                SE.ShowUrlPage(window.location.search.substr(1));
            else
                SE.ShowHome();
        });
    });

    window.onpopstate = function (e) {
        if (e && e.state)
            SE.ShowHomeView(e.state.view, e.state.data, e.state.params, true);
    };

    setInterval(loadSteemPrice, 30 * 1000);
});