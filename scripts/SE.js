SE = {
	User: null,
	Params: {},
	Tokens: [],
	ScotTokens: {},

	Api: function (url, data, callback, always) {
		if (data == null || data == undefined) data = {};

		// Add a dummy timestamp parameter to prevent IE from caching the requests.
		data.v = new Date().getTime();

		jQuery
			.getJSON(Config.ACCOUNTS_API_URL + url, data, function (response) {
				if (callback != null && callback != undefined) callback(response);
			})
			.always(function () {
				if (always) always();
			});
	},

	ShowHomeView: function (view, data, url_params) {
		window.scrollTo(0, 0);
		$('body').css('overflow', 'auto');
		$('body').css('padding-right', '0');

		if (Config.MAINTENANCE_MODE)
			view = 'maintenance';

		$('#page_container').html(render(view, { data: data }));

		SE.LastView = SE.CurrentView;
		SE.CurrentView = { view: view, data: data };

		// Collapse the nav bar hamburger menu on mobile devices
		if (window.innerWidth <= 990) {
			var burger = $('.navbar-toggle');
			if (!burger.hasClass('collapsed'))
				burger.click();
		}

		if (view != 'home') {
			var url = '?p=' + view + (url_params ? '&' + $.param(url_params) : '');

			if (window.location.search == url)
				window.history.replaceState({ data: data, view: view, params: url_params }, 'Steem Engine - Smart Contracts on the STEEM blockchain', url);
			else
				window.history.pushState({ data: data, view: view, params: url_params }, 'Steem Engine - Smart Contracts on the STEEM blockchain', url);
		}
	},

	ShowDialog: function (dialog, data) {
		$('#dialog_container').html(renderDialog(dialog, data));
		$('#dialog_container').modal('show');
	},

	ShowUrlPage(url) {
		var parts = JSON.parse('{"' + decodeURI(url).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');

		if (!parts.p) {
			SE.ShowHome();
			return;
		}

		switch (parts.p) {
			case 'balances':
				SE.ShowBalances(parts.a ? parts.a : SE.User.name);
				break;
			case 'rewards':
				SE.ShowRewards(parts.a ? parts.a : SE.User.name);
				break;
			case 'open_orders':
				SE.ShowOpenOrders(parts.a ? parts.a : SE.User.name);
				break;
			case 'tokens':
				SE.ShowTokens();
				break;
			case 'history':
				if (SE.User || parts.a) {
					SE.LoadBalances(parts.a ? parts.a : SE.User.name, () => {
						if (parts.t && SE.Tokens.find(t => t.symbol == parts.t))
							SE.ShowHistory(parts.t);
						else
							SE.ShowTokens();
					});
				} else
					SE.ShowTokens();
				break;
			case 'pending_unstakes':
				SE.LoadPendingUnstakes(SE.User.name, () => {
					SE.ShowPendingUnstakes();
				});
				break;
			case 'pending_undelegations':
				SE.LoadPendingUndelegations(SE.User.name, () => {
					SE.ShowPendingUndelegations();
				});
				break;
			case 'add_token':
				SE.ShowAddToken();
				break; pending_unstakes
			case 'faq':
				SE.ShowFAQ();
				break;
			case 'market':
				SE.ShowMarket(parts.t);
				break;
			case 'conversion_history':
				SE.ShowConversionHistory();
				break;
			default:
				SE.ShowHome();
				break;
		}
	},

	HideDialog: function (viewToShowAfter, data) {
		$('#dialog_container').modal('hide');
		if (viewToShowAfter)
			SE.ShowHomeView(viewToShowAfter, data);
	},

	ShowDialogOpaque: function (dialog, data) {
		$('#dialog_container').html(renderDialog(dialog, data));
		$('#dialog_container').modal('show');
		$('.modal-backdrop').addClass('modal-backdrop-opaque');
	},

	ShowHome: function () {
		SE.ShowHomeView('home');
	},

	_loading: null,
	ShowLoading: function () {
		SE._loading = $('<div class="modal-backdrop fade show loading-backdrop" />');
		SE._loading.append(
			$(
				'<img src="https://s3.amazonaws.com/steemmonsters/website/loading.gif" class="loading" />'
			)
		);
		SE._loading.appendTo('body');
	},

	HideLoading: function () {
		SE._loading.remove();
	},

	ShowToast: function (isSuccess, message) {
		var toast = $(renderComponent("toast", { isSuccess: isSuccess, message: message }));
		$('#toast_container').append(toast);
		toast.toast('show');
	},

	ShowTokens: function () {
		SE.LoadTokens(r => SE.ShowHomeView('tokens', r));
	},

	ShowMarket: function (token) {
		if (!token)
			token = Config.NATIVE_TOKEN;

		SE.LoadTokens(r => SE.ShowHomeView('market', { selected: token }, { t: token }));
	},

	ShowMarketView: function (symbol, account) {
		SE.ShowLoading();

		if (symbol == Config.PEGGED_TOKEN)
			symbol = Config.NATIVE_TOKEN;

		if (!account && SE.User)
			account = SE.User.name;

		var token = SE.GetToken(symbol);

		if (token.metadata && token.metadata.hide_in_market) {
			SE.HideLoading();
			$('#market_view').html(render('components/not_available'));
			return;
		}

		let precision = token.precision

		let tasks = [];
		tasks.push(ssc.find('market', 'buyBook', { symbol: symbol }, 200, 0, [{ index: 'priceDec', descending: true }], false));
		tasks.push(ssc.find('market', 'sellBook', { symbol: symbol }, 200, 0, [{ index: 'priceDec', descending: false }], false));
		tasks.push(ssc.find('market', 'tradesHistory', { symbol: symbol }, 30, 0, [{ index: '_id', descending: true }], false));

		let marketHistoryGet = Config.HISTORY_API + 'marketHistory?symbol=' + symbol;
		tasks.push($.get(marketHistoryGet));

		if (account) {
			tasks.push(ssc.find('market', 'buyBook', { symbol: symbol, account: account }, 100, 0, [{ index: '_id', descending: true }], false));
			tasks.push(ssc.find('market', 'sellBook', { symbol: symbol, account: account }, 100, 0, [{ index: '_id', descending: true }], false));
			tasks.push(ssc.find('tokens', 'balances', { account: account, symbol: { '$in': [symbol, 'STEEMP'] } }, 2, 0, '', false));
		}
		Promise.all(tasks).then(results => {
			// prepare buy orders
			var buy_total = 0;
			let buy_orders = results[0].map(o => {
				buy_total += o.quantity * o.price;
				o.total = buy_total;
				o.amountLocked = o.quantity * o.price;
				return o;
			});
			// prepare sell orders
			var sell_total = 0;
			let sell_orders = results[1].map(o => {
				sell_total += o.quantity * o.price;
				o.total = sell_total;
				o.amountLocked = o.quantity * o.price;
				return o;
			});
			// prepare trade history
			let trade_history = results[2].map(o => {
				o.total = o.price * o.quantity;
				o.timestamp_string = moment.unix(o.timestamp).format('YYYY-M-DD HH:mm:ss');
				return o;
			});

			const limitCandleStick = 60;
			let market_history = results[3].slice(0, limitCandleStick).map(x => {
				return {
					t: moment.unix(x.timestamp).format('YYYY-MM-DD HH:mm:ss'), //x.timestamp * 1000,
					o: x.openPrice,
					h: x.highestPrice,
					l: x.lowestPrice,
					c: x.closePrice,
				}
			});

			let user_orders = [];
			let user_token_balance = null;
			let user_steemp_balance = null;
			if (account) {
				// prepare user orders and balance
				let user_buy_orders = results[4].map(o => {
					o.type = 'buy';
					o.total = o.price * o.quantity;
					o.timestamp_string = moment.unix(o.timestamp).format('YYYY-M-DD HH:mm:ss');
					return o;
				});
				let user_sell_orders = results[5].map(o => {
					o.type = 'sell';
					o.total = o.price * o.quantity;
					o.timestamp_string = moment.unix(o.timestamp).format('YYYY-M-DD HH:mm:ss');
					return o;
				});
				user_orders = user_buy_orders.concat(user_sell_orders);
				user_orders.sort((a, b) => b.timestamp - a.timestamp);

				user_token_balance = _.find(results[6], (balance) => balance.symbol === symbol);
				user_steemp_balance = _.find(results[6], (balance) => balance.symbol === 'STEEMP');
			}

			$('#market_view').html(render('market_view', {
				data: {
					token: symbol,
					precision: precision,
					buy_orders: buy_orders,
					sell_orders: sell_orders,
					trade_history: trade_history,
					market_history: market_history,
					user_orders: user_orders,
					user_token_balance: user_token_balance,
					user_steemp_balance: user_steemp_balance
				}
			}));

			SE.HideLoading();
		}, error => {
			SE.HideLoading();
			SE.ShowToast(false, 'Error retrieving market data.');
		});
	},

	ShowMarketOrderDialog: function (type, symbol, quantity, price) {
		SE.ShowDialogOpaque('confirm_market_order', { type: type, symbol: symbol, quantity: quantity, price: price });
	},

	ShowMarketCancelDialog: function (type, orderId, symbol, origin = 'market') {
		SE.ShowDialogOpaque('confirm_market_cancel', { type: type, orderId: orderId, symbol: symbol, origin: origin });
	},

	ShowMarketCancelSelectedDialog: function (orders, origin = 'market') {
		SE.ShowDialogOpaque('confirm_market_cancel_selected', { orders: orders, origin: origin });
	},

	SendMarketOrder: function (type, symbol, quantity, price) {
		if (type !== 'buy' && type !== 'sell') {
			console.error('Invalid order type: ', type)
			return;
		}

		SE.ShowLoading();
		var username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		var transaction_data = {
			"contractName": "market",
			"contractAction": type,
			"contractPayload": {
				"symbol": symbol,
				"quantity": quantity,
				"price": price
			}
		};

		console.log('Broadcasting ' + type + ' order: ', JSON.stringify(transaction_data));

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), type.toUpperCase() + ' Order: ' + symbol, function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success)
							SE.ShowToast(true, type.toUpperCase() + ' order placed for ' + quantity + ' ' + symbol + ' at ' + price)
						else
							SE.ShowToast(false, 'An error occurred submitting the order: ' + tx.error)

						SE.HideLoading();
						SE.HideDialog();
						SE.LoadTokens(() => SE.ShowMarketView(symbol, SE.User.name));
					});
				}
				else
					SE.HideLoading();
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.LoadTokens(() => SE.ShowMarketView(symbol, SE.User.name));
			});
		}
	},

	SendCancelMarketOrderSelected: async function (orders, origin = 'market') {
		let successCount = 0;
		let symbol = "";
		if (orders && orders.length > 0) {
			SE.ShowLoading();

			var transaction_data = [];

			for (var i = 0; i < orders.length; i++) {
				let order = orders[i];
				let type = order.txType;
				let orderId = order.txId;
				symbol = order.symbol;

				transaction_data.push({
					"contractName": "market",
					"contractAction": "cancel",
					"contractPayload": {
						"type": type,
						"id": orderId
					}
				});
			}

			let orderRes = await new Promise(function (resolve, reject) {
				var username = localStorage.getItem('username');

				if (!username) {
					window.location.reload();
					return;
				}

				console.log('Broadcasting cancel order: ', JSON.stringify(transaction_data));

				// the function is executed automatically when the promise is constructed
				if (useKeychain()) {
					steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Cancel Orders', function (response) {
						if (response.success && response.result) {
							SE.ShowToast(true, 'Please wait until the transaction is verified.');

							let txId = response.result.id;

							// check last transaction in case bulk cancellation
							// transactions to check in engine sidechain have id's like: {txId}-0, {txId}-1, {txId}-2 etc.
							if (orders.length > 1) {
								txId = response.result.id + "-" + (orders.length - 1).toString();
							}

							SE.CheckTransaction(txId, 3, tx => {
								if (tx.success) {
									SE.ShowToast(true, 'Cancel orders completed');
									resolve(true);
								} else {
									SE.ShowToast(false, 'An error occurred cancelling the order: ' + tx.error)
									resolve(false);
								}
							});
						} else {
							resolve(false);
						}
					});
				} else {
					SE.ShowToast(false, 'Bulk cancellation is currently only supported in combination with Keychain.');
					SE.HideLoading();
					SE.HideDialog();
				}
			});

			if (orderRes) {
				successCount++;
			}

			SE.HideLoading();
			SE.HideDialog();

			if (successCount > 0) {
				if (origin == 'open_orders') {
					SE.ShowOpenOrders(SE.User.name);
				} else {
					SE.ShowMarketView(symbol, SE.User.name);
				}
			}
		}
	},

	SendCancelMarketOrder: function (type, orderId, symbol, origin = 'market') {
		if (type !== 'buy' && type !== 'sell') {
			console.error('Invalid order type: ', type)
			return;
		}

		SE.ShowLoading();
		var username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		var transaction_data = {
			"contractName": "market",
			"contractAction": "cancel",
			"contractPayload": {
				"type": type,
				"id": orderId
			}
		};

		console.log('Broadcasting cancel order: ', JSON.stringify(transaction_data));

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Cancel ' + type.toUpperCase() + ' Order', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Cancel order ' + orderId + ' completed');
						} else {
							SE.ShowToast(false, 'An error occurred cancelling the order: ' + tx.error)
						}

						SE.HideLoading();
						SE.HideDialog();

						if (origin == 'open_orders') {
							SE.ShowOpenOrders(SE.User.name);
						} else {
							SE.ShowMarketView(symbol, SE.User.name);
						}
					});
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.ShowMarketView(symbol, SE.User.name);
			});
		}
	},

	LoadTokens: function (callback) {
		ssc.find('tokens', 'tokens', {}, 1000, 0, [], (err, result) => {
			SE.Tokens = result.filter(t => !Config.DISABLED_TOKENS.includes(t.symbol));

			ssc.find('market', 'metrics', {}, 1000, 0, '', false).then(async (metrics) => {
				for (var i = 0; i < SE.Tokens.length; i++) {
					var token = SE.Tokens[i];

					token.highestBid = 0;
					token.lastPrice = 0;
					token.lowestAsk = 0;
					token.marketCap = 0;
					token.volume = 0;
					token.priceChangePercent = 0;
					token.priceChangeSteem = 0;

					token.metadata = tryParse(token.metadata);

					if (!token.metadata) {
						token.metadata = {};
					}

					Object.keys(token.metadata).forEach(key => token.metadata[key] = filterXSS(token.metadata[key]));

					if (!metrics) {
						return;
					}

					var metric = metrics.find(m => token.symbol == m.symbol);

					if (metric) {
						token.highestBid = parseFloat(metric.highestBid);
						token.lastPrice = parseFloat(metric.lastPrice);
						token.lowestAsk = parseFloat(metric.lowestAsk);
						token.marketCap = token.lastPrice * token.circulatingSupply;

						if (Date.now() / 1000 < metric.volumeExpiration)
							token.volume = parseFloat(metric.volume);

						if (Date.now() / 1000 < metric.lastDayPriceExpiration) {
							token.priceChangePercent = parseFloat(metric.priceChangePercent);
							token.priceChangeSteem = parseFloat(metric.priceChangeSteem);
						}

						if (token.symbol == 'AFIT') {
							var afit_data = await ssc.find('market', 'tradesHistory', { symbol: 'AFIT' }, 100, 0, [{ index: '_id', descending: false }], false);
							token.volume = afit_data.reduce((t, v) => t += parseFloat(v.price) * parseFloat(v.quantity), 0);
						}
					}

					if (token.symbol == 'STEEMP')
						token.lastPrice = 1;
				}

				SE.Tokens.sort((a, b) => {
					return (b.volume > 0 ? b.volume : b.marketCap / 1000000000000) - (a.volume > 0 ? a.volume : a.marketCap / 1000000000000);
				});

				var steemp_balance = await ssc.findOne('tokens', 'balances', { account: 'steem-peg', symbol: 'STEEMP' });

				if (steemp_balance && steemp_balance.balance) {
					var token = SE.GetToken('STEEMP');
					token.supply -= parseFloat(steemp_balance.balance);
					token.circulatingSupply -= parseFloat(steemp_balance.balance);
				}

				if (callback)
					callback(SE.Tokens);
			});
		});
	},

	ShowBalances: function (account) {
		if (!account && SE.User) {
			account = SE.User.name;
		}

		SE.LoadBalances(account, r => {
			SE.ShowHomeView('balances', { balances: r, account: account }, { a: account });
		});
	},

	ShowRewards: function (account) {
		if (!account && SE.User) {
			account = SE.User.name;
		}

		SE.GetScotUserTokens(account, scotTokens => {
			SE.ShowHomeView('rewards', { scotTokens: scotTokens, account: account }, { a: account });
		});
	},

	ShowOpenOrders: function (account) {
		if (!account && SE.User) {
			account = SE.User.name;
		}

		let tasks = [];

		if (account) {
			tasks.push(ssc.find('market', 'buyBook', { account: account }, 100, 0, [{ index: '_id', descending: true }], false));
			tasks.push(ssc.find('market', 'sellBook', { account: account }, 100, 0, [{ index: '_id', descending: true }], false));
		}

		Promise.all(tasks).then(results => {
			let user_orders = [];
			let user_token_balance = null;
			let user_hive_balance = null;
			if (account) {
				// prepare user orders and balance
				let user_buy_orders = results[0].map(o => {
					o.type = 'buy';
					o.total = o.price * o.quantity;
					o.timestamp_string = moment.unix(o.timestamp).format('YYYY-M-DD HH:mm:ss');
					return o;
				});
				let user_sell_orders = results[1].map(o => {
					o.type = 'sell';
					o.total = o.price * o.quantity;
					o.timestamp_string = moment.unix(o.timestamp).format('YYYY-M-DD HH:mm:ss');
					return o;
				});
				user_orders = user_buy_orders.concat(user_sell_orders);
				user_orders.sort((a, b) => b.timestamp - a.timestamp);

				SE.ShowHomeView('open_orders', { orders: user_orders, account: account }, { a: account });
				SE.HideLoading();
			}
		});
	},

	GetScotUserTokens: function (account, callback) {
		if (!account && SE.User) {
			account = SE.User.name;
		}

		if (!SE.User) {
			SE.User = {};
		}

		SE.User.ScotTokens = [];

		$.get(Config.SCOT_API + `@${account}`, { v: new Date().getTime() }, results => {
			if (results) {
				let mapped = [];

				for (const key in results) {
					const config = results[key];

					if (config.pending_token) {
						mapped.push(config);
					}
				}

				SE.User.ScotTokens = mapped;

				if (callback) {
					callback(mapped);
				}
			}
		}).fail(() => {
			if (callback)
				callback([]);
		});
	},

	ClaimToken: function (symbol, amount) {
		SE.ShowLoading();

		const token = SE.Tokens.find(t => t.symbol === symbol);
		const username = SE.User.name;
		const factor = Math.pow(10, token.precision);
		const calculated = amount / factor;

		const claimData = {
			symbol
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, 'scot_claim_token', 'Posting', JSON.stringify(claimData), `Claim ${calculated} ${symbol.toUpperCase()} Tokens`, function (response) {
				if (response.success && response.result) {
					SE.ShowToast(true, `${symbol.toUpperCase()} tokens claimed`);
					SE.HideLoading();
					SE.ShowRewards();
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJsonId('posting', 'scot_claim_token', claimData, () => {
				SE.HideLoading();
				SE.ShowRewards();
			});
		}
	},


	ClaimAllTokens: function () {
		SE.ShowLoading();

		const username = SE.User.name;
		const scotTokens = SE.User.ScotTokens;

		if (scotTokens && scotTokens.length > 0) {
			let claimData = [];

			for (let st of scotTokens) {
				var token = SE.Tokens.find(t => t.symbol === st.symbol);

				if (!token) {
					continue;
				}

				if (st.pending_token > 0) {
					claimData.push({ "symbol": st.symbol });
				}
			}

			if (claimData.length > 0) {
				if (useKeychain()) {
					steem_keychain.requestCustomJson(username, 'scot_claim_token', 'Posting', JSON.stringify(claimData), `Claim All Tokens`, function (response) {
						if (response.success && response.result) {
							SE.ShowToast(true, `All tokens claimed`);
							SE.HideLoading();
							SE.ShowRewards();
						} else {
							SE.HideLoading();
						}
					});
				} else {
					SE.SteemConnectJsonId('posting', 'scot_claim_token', claimData, () => {
						SE.HideLoading();
						SE.ShowRewards();
					});
				}
			}
		} else {
			SE.HideLoading();
		}
	},

	EnableStaking: function (symbol, unstakingCooldown, numberTransactions) {
		SE.ShowLoading();

		const username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		const transaction_data = {
			"contractName": "tokens",
			"contractAction": "enableStaking",
			"contractPayload": {
				"symbol": symbol,
				"unstakingCooldown": unstakingCooldown,
				"numberTransactions": numberTransactions
			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Enable Token Staking', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Token staking enabled!');
							window.location.reload();
						} else {
							SE.ShowToast(false, 'An error occurred attempting to enable staking on your token: ' + tx.error);
						}

						SE.HideLoading();
						SE.HideDialog();
					});
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.HideLoading();
				SE.HideDialog();
			});
		}
	},

	Stake: function (symbol, quantity, to) {
		SE.ShowLoading();

		const username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		const transaction_data = {
			"contractName": "tokens",
			"contractAction": "stake",
			"contractPayload": {
				"to": to,
				"symbol": symbol,
				"quantity": quantity
			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Stake Token', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Token successfully staked');
							SE.ShowBalances(SE.User.name);
						} else {
							SE.ShowToast(false, 'An error occurred attempting to enable stake token: ' + tx.error);
						}

						SE.HideLoading();
						SE.HideDialog();
					});
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.ShowBalances(SE.User.name);
			});
		}
	},

	Unstake: function (symbol, quantity) {
		SE.ShowLoading();

		const username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		const transaction_data = {
			"contractName": "tokens",
			"contractAction": "unstake",
			"contractPayload": {
				"symbol": symbol,
				"quantity": quantity
			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Stake Token', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Token successfully staked');
						} else {
							SE.ShowToast(false, 'An error occurred attempting to enable stake token: ' + tx.error);
						}

						SE.HideLoading();
						SE.HideDialog();
					});
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.HideLoading();
				SE.HideDialog();
			});
		}
	},

	CancelUnstake: function (txID) {
		SE.ShowLoading();

		const username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		const transaction_data = {
			"contractName": "tokens",
			"contractAction": "cancelUnstake",
			"contractPayload": {
				"txID": txID
			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Stake Token', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Token unstaking successfully cancelled');
							SE.ShowHomeView('pending_unstakes');
						} else {
							SE.ShowToast(false, 'An error occurred attempting to unstake tokens: ' + tx.error);
						}

						SE.HideLoading();
						SE.HideDialog();
					});
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.HideLoading();
				SE.HideDialog();
				SE.ShowHomeView('pending_unstakes');
			});
		}
	},

	EnableDelegation: function (symbol, undelegationCooldown) {
		SE.ShowLoading();

		const username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		const transaction_data = {
			"contractName": "tokens",
			"contractAction": "enableDelegation",
			"contractPayload": {
				"symbol": symbol,
				"undelegationCooldown": undelegationCooldown
			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Enable Token Delegation', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Token delegation enabled!');
							window.location.reload();
						} else {
							SE.ShowToast(false, 'An error occurred attempting to enable delegation on your token: ' + tx.error);
						}

						SE.HideLoading();
						SE.HideDialog();
					});
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.HideLoading();
				SE.HideDialog();
			});
		}
	},

	Delegate: function (symbol, quantity, to) {
		SE.ShowLoading();

		const username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		const transaction_data = {
			"contractName": "tokens",
			"contractAction": "delegate",
			"contractPayload": {
				"to": to,
				"symbol": symbol,
				"quantity": quantity
			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Delegate Token', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Token successfully delegated');
							SE.ShowBalances(SE.User.name);
						} else {
							SE.ShowToast(false, 'An error occurred attempting to delegate token: ' + tx.error);
						}

						SE.HideLoading();
						SE.HideDialog();
					});
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.ShowBalances(SE.User.name);
			});
		}
	},

	Undelegate: function (symbol, quantity, from) {
		SE.ShowLoading();

		const username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		const transaction_data = {
			"contractName": "tokens",
			"contractAction": "undelegate",
			"contractPayload": {
				"from": from,
				"symbol": symbol,
				"quantity": quantity
			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Undelegate Tokens', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Token undelegated');
						} else {
							SE.ShowToast(false, 'An error occurred attempting to undelegate: ' + tx.error);
						}

						SE.HideLoading();
						SE.HideDialog();
					});
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.HideLoading();
				SE.HideDialog();
			});
		}
	},

	LoadParams: function (callback) {
		var loaded = 0;

		ssc.findOne('sscstore', 'params', {}, (err, result) => {
			if (result && !err)
				Object.assign(SE.Params, result);

			if (++loaded >= 3 && callback)
				callback();
		});

		ssc.findOne('tokens', 'params', {}, (err, result) => {
			if (result && !err)
				Object.assign(SE.Params, result);

			if (++loaded >= 3 && callback)
				callback();
		});

		loadSteemPrice(() => {
			if (++loaded >= 3 && callback)
				callback();
		});
	},

	LoadPendingUnstakes: function (account, callback) {
		ssc.find('tokens', 'pendingUnstakes', { account: account }, 1000, 0, '', false).then(r => {
			if (SE.User && account == SE.User.name) {
				SE.User.pendingUnstakes = r;
			}

			if (callback) {
				callback(r);
			}
		});
	},

	LoadPendingUndelegations: function (account, callback) {
		ssc.find('tokens', 'pendingUndelegations', { account: account }, 1000, 0, '', false).then(r => {
			if (SE.User && account == SE.User.name) {
				SE.User.pendingUndelegations = r;
			}

			if (callback) {
				callback(r);
			}
		});
	},

	LoadBalances: function (account, callback) {
		ssc.find('tokens', 'balances', { account: account }, 1000, 0, '', false).then(r => {
			if (SE.User && account == SE.User.name)
				SE.User.balances = r;

			if (callback)
				callback(r);
		});
	},

	GetBalance: function (token) {
		if (SE.User && SE.User.balances) {
			var token = SE.User.balances.find(b => b.symbol == token);
			return token ? parseFloat(token.balance) : 0;
		} else
			return 0;
	},

	ShowHistory: function (symbol, name) {
		var token = SE.GetToken(symbol);
		SE.ShowHomeView('history', token, { t: symbol });
	},

	ShowPendingUnstakes: function () {
		SE.ShowHomeView('pending_unstakes');
	},

	ShowPendingUndelegations: function () {
		SE.ShowHomeView('pending_undelegations');
	},

	ShowAbout: function () {
		SE.ShowHomeView('about');
	},

	ShowConversionHistory: function () {
		$.get('https://converter-api.steem-engine.net/api/conversions/', { limit: 20, offset: 0, deposit__from_account: SE.User.name }, from_result => {
			$.get('https://converter-api.steem-engine.net/api/conversions/', { limit: 20, offset: 0, to_address: SE.User.name }, to_result => {
				var to_results = to_result.results.map(r => {
					return {
						coin_symbol: r.from_coin_symbol,
						created_at: r.created_at,
						amount: parseFloat(r.to_amount) + parseFloat(r.ex_fee),
						to_address: r.to_memo.substr(r.to_memo.lastIndexOf(' ') + 1),
						txid: r.to_txid,
						ex_fee: r.ex_fee
					}
				});

				var from_results = from_result.results.map(r => {
					return {
						coin_symbol: r.from_coin_symbol,
						created_at: r.created_at,
						amount: parseFloat(r.to_amount) + parseFloat(r.ex_fee),
						to_address: r.to_address,
						txid: r.to_txid,
						ex_fee: r.ex_fee
					}
				});

				var list = from_results.concat(to_results);
				list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				SE.ShowHomeView('conversion_history', list);
			});
		});
	},

	ShowFAQ: function () {
		SE.ShowHomeView('faq');
	},

	ShowRegister: function () {
		SE.ShowHomeView('register', localStorage.getItem('username'));
	},

	ShowSignIn: function () {
		SE.ShowHomeView('sign_in');
	},

	ShowAddToken: function () {
		SE.ShowHomeView('add_token');
	},

	ShowConfirmAddToken: function (name, symbol, precision, maxSupply, url) {
		SE.ShowDialogOpaque('confirm_add_token', {
			"name": name,
			"symbol": symbol,
			"precision": precision,
			"maxSupply": maxSupply,
			"url": url,
		});
	},

	OnLogin: function (username, callback) {
		SE.ShowLoading();
		SE.User = { name: username };
		$("#btnSignIn").hide();
		$("#lnkUsername").html(`@${username}`);
		$("#ddlLoggedIn").show();
		$('#nav_wallet').show();

		// Load the steem account info
		steem.api.getAccounts([username], (e, r) => {
			if (r && !e && r.length > 0)
				SE.User.account = r[0];
		});

		SE.LoadBalances(username);
		SE.LoadPendingUnstakes(username);
		SE.LoadPendingUndelegations(username);

		SE.GetScotUserTokens(username, scotTokens => {
			if (scotTokens.length) {
				var rewardCount = scotTokens.length;
				for (let st of scotTokens) {
					var token = SE.Tokens.find(t => t.symbol === st.symbol);

					if (!token) {
						rewardCount--;
					}
				}

				if (rewardCount > 0)
					$("#lnkUsername").html(`@${username} <span class="badge rewards">${rewardCount}</span>`);
			}
		});

		if (callback) {
			callback(SE.User);
		}
	},

	LogIn: function (username, key) {
		SE.ShowLoading();

		if (window.steem_keychain && !key) {
			steem_keychain.requestSignBuffer(username, 'Log In', 'Posting', function (response) {
				if (response.error) {
					SE.HideLoading();
					SE.ShowToast(false, 'Unable to log in with the @' + username + ' account.');
				} else {
					localStorage.setItem('username', username);
					window.location.reload();
				}
			});
		} else {
			try {
				if (key && !steem.auth.isWif(key)) {
					key = steem.auth.getPrivateKeys(username, key, ['posting']).posting;
				}
			} catch (err) {
				SE.ShowToast(false, 'Invalid private key or master password.');
				return;
			}

			steem.api.getAccounts([username], function (e, r) {
				if (r && r.length > 0) {
					try {
						if (steem.auth.wifToPublic(key) == r[0].memo_key || steem.auth.wifToPublic(key) == r[0].posting.key_auths[0][0]) {
							localStorage.setItem('username', username);
							window.location.reload();
						} else {
							SE.HideLoading();
							SE.ShowToast(false, 'Unable to log in with the @' + username + ' account. Invalid private key or password.');
						}
					} catch (err) {
						SE.HideLoading();
						SE.ShowToast(false, 'Unable to log in with the @' + username + ' account. Invalid private key or password.');
					}
				} else {
					SE.ShowToast(false, 'There was an error loading the @' + username + ' account.');
				}
			});
		}
	},

	LogOut: function () {
		localStorage.clear();
		SE.User = null;
		window.location.href = window.location.origin;
	},

	CheckRegistration: function (username, callback) {
		ssc.findOne('accounts', 'accounts', { id: username }, (err, result) => { if (callback) callback(result); });
	},

	CheckRegistrationStatus: function (interval = 5, retries = 5, callback) {
		var username = localStorage.getItem('username');
		console.log('Checking registration status: ' + username);

		SE.CheckRegistration(username, r => {
			if (r) {
				if (callback) callback(r);
			} else {
				if (retries > 0) {
					console.log("Retrying...");
					setTimeout(function () {
						SE.CheckRegistrationStatus(interval, retries - 1, callback);
					}, interval * 1000);
				}
				else {
					//alert("Registration not found for @" + username + "\nPlease check again later.");
				}
			}
		});
	},

	UpdateTokenMetadata: function (symbol, metadata) {
		SE.ShowLoading();
		var username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		var transaction_data = {
			"contractName": "tokens",
			"contractAction": "updateMetadata",
			"contractPayload": {
				"symbol": symbol,
				"metadata": metadata
			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Update Token Metadata', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success)
							SE.ShowToast(true, 'Token updated successfully!');
						else
							SE.ShowToast(false, 'An error occurred updating your token: ' + tx.error);

						SE.HideLoading();
						SE.HideDialog();
						SE.LoadTokens(() => SE.ShowHistory(symbol));
					});
				}
				else
					SE.HideLoading()
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.LoadTokens(() => SE.ShowHistory(symbol));
			});
		}
	},

	UpdateTokenPrecision: function (symbol, precision) {
		SE.ShowLoading();

		const username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		var transaction_data = {
			"contractName": "tokens",
			"contractAction": "updatePrecision",
			"contractPayload": {
				"symbol": symbol,
				"precision": precision
			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Update Token Prevision', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Token updated successfully!');
						} else {
							SE.ShowToast(false, 'An error occurred updating your token: ' + tx.error);
							SE.HideLoading();
							SE.HideDialog();
							SE.LoadTokens(() => SE.ShowHistory(symbol));
						}
					});
				} else {
					SE.HideLoading();
				}
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.LoadTokens(() => SE.ShowHistory(symbol));
			});
		}
	},

	RegisterToken: function (name, symbol, precision, maxSupply, url) {
		SE.ShowLoading();
		var username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		var registration_data = {
			"contractName": "tokens",
			"contractAction": "create",
			"contractPayload": {
				"symbol": symbol,
				"name": name,
				"precision": precision,
				"maxSupply": maxSupply
			}
		};

		if (url)
			registration_data.contractPayload.url = url;

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(registration_data), 'Steem Engine Token Registration', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success)
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

	ShowIssueTokenDialog: function (symbol, balance) {
		SE.ShowDialog('issue_token', { symbol: symbol, balance: balance });
	},

	IssueToken: function (symbol, to, quantity) {
		SE.ShowLoading();
		var username = localStorage.getItem('username');

		if (!username) {
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

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Token Issue: ' + symbol, function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success)
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

	ShowSendTokenDialog: function (symbol, balance) {
		SE.ShowDialog('send_token', { symbol: filterXSS(symbol), balance: filterXSS(balance) });
	},

	ShowStakeDialog: function (symbol, balance) {
		SE.ShowDialog('stake_token', { symbol: filterXSS(symbol), balance: filterXSS(balance) });
	},

	ShowUnstakeDialog: function (symbol, staked) {
		SE.ShowDialog('unstake_token', { symbol: filterXSS(symbol), balance: filterXSS(staked) });
	},

	ShowEnableStakeDialog: function (symbol) {
		SE.ShowDialog('stake_token_enable', { symbol: filterXSS(symbol) });
	},

	ShowDelegateDialog: function (symbol, balance) {
		SE.ShowDialog('delegate_token', { symbol: symbol, balance: filterXSS(balance) });
	},

	ShowUndelegateDialog: function (symbol, staked) {
		SE.ShowDialog('undelegate_token', { symbol: symbol, balance: filterXSS(staked) });
	},

	ShowEnableDelegationDialog: function (symbol) {
		SE.ShowDialog('token_delegation_enable', { symbol: filterXSS(symbol) });
	},

	SendToken: function (symbol, to, quantity, memo) {
		SE.ShowLoading();
		var username = localStorage.getItem('username');

		if (!username) {
			window.location.reload();
			return;
		}

		var transaction_data = {
			"contractName": "tokens",
			"contractAction": "transfer",
			"contractPayload": {
				"symbol": symbol,
				"to": to,
				"quantity": quantity + '',
				"memo": memo
			}
		};

		console.log('SENDING: ' + symbol);

		if (useKeychain()) {
			steem_keychain.requestCustomJson(username, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Token Transfer: ' + symbol, function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success)
							SE.ShowToast(true, quantity + ' ' + symbol + ' Tokens sent to @' + to)
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

	ShowBuySSC: function () {
		SE.ShowDialog('buy_ssc', null);
	},

	BuySSC: function (amount) {
		SE.ShowLoading();

		if (!SE.User) {
			window.location.reload();
			return;
		}

		var transaction_data = {
			id: Config.CHAIN_ID,
			json: {
				"contractName": "sscstore",
				"contractAction": "buy",
				"contractPayload": {}
			}
		};

		if (useKeychain()) {
			steem_keychain.requestTransfer(SE.User.name, 'steemsc', (amount).toFixedNoRounding(3), JSON.stringify(transaction_data), 'STEEM', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
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
			SE.SteemConnectTransfer(SE.User.name, 'steemsc', (amount).toFixedNoRounding(3) + ' STEEM', JSON.stringify(transaction_data), () => {
				SE.LoadBalances(SE.User.name, () => SE.ShowHistory(Config.NATIVE_TOKEN, 'Steem Engine Tokens'));
			});
		}
	},

	DepositSteem: function (amount) {
		SE.ShowLoading();

		if (!SE.User) {
			window.location.reload();
			return;
		}

		var transaction_data = {
			id: Config.CHAIN_ID,
			json: {
				"contractName": "steempegged",
				"contractAction": "buy",
				"contractPayload": {}
			}
		};

		if (useKeychain()) {
			steem_keychain.requestTransfer(SE.User.name, Config.STEEMP_ACCOUNT, (amount).toFixedNoRounding(3), JSON.stringify(transaction_data), 'STEEM', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success) {
							SE.ShowToast(true, 'Deposit transaction sent successfully.');
							SE.HideLoading();
							SE.HideDialog();
							SE.LoadBalances(SE.User.name, () => SE.ShowMarket());
						} else
							SE.ShowToast(false, 'An error occurred depositing STEEM: ' + tx.error);
					});
				}
				else
					SE.HideLoading();
			});
		} else {
			SE.HideLoading();
			SE.SteemConnectTransfer(SE.User.name, Config.STEEMP_ACCOUNT, (amount).toFixedNoRounding(3) + ' STEEM', JSON.stringify(transaction_data), () => {
				SE.LoadBalances(SE.User.name, () => SE.ShowMarket());
			});
		}
	},

	WithdrawSteem: function (amount) {
		SE.ShowLoading();

		if (!SE.User) {
			window.location.reload();
			return;
		}

		var transaction_data = {
			"contractName": "steempegged",
			"contractAction": "withdraw",
			"contractPayload": {
				"quantity": (amount).toFixedNoRounding(3)

			}
		};

		if (useKeychain()) {
			steem_keychain.requestCustomJson(SE.User.name, Config.CHAIN_ID, 'Active', JSON.stringify(transaction_data), 'Withdraw STEEM', function (response) {
				if (response.success && response.result) {
					SE.CheckTransaction(response.result.id, 3, tx => {
						if (tx.success)
							SE.ShowToast(true, amount.toFixed(3) + ' STEEMP withdrawn to @' + SE.User.name);
						else
							SE.ShowToast(false, 'An error occurred submitting the transaction: ' + tx.error)

						SE.HideLoading();
						SE.HideDialog();
						SE.LoadBalances(SE.User.name, () => SE.ShowMarket());
					});
				}
				else
					SE.HideLoading();
			});
		} else {
			SE.SteemConnectJson('active', transaction_data, () => {
				SE.LoadBalances(SE.User.name, () => SE.ShowMarket());
			});
		}
	},

	ShowTransactionDialog: function (data) {
		SE.ShowDialog('transaction', data);
	},

	_sc_callback: null,
	SteemConnectJson: function (auth_type, data, callback) {
		SE.ShowToast(false, 'SteemConnect is deprecated. Please use <a href="https://chrome.google.com/webstore/detail/steem-keychain/lkcjlnjfpbikmcmbachjpdbijejflpcm" target="_blank">Keychain</a>.');
		SE.HideLoading();
		return false;
		SE.HideLoading();
		SE.ShowDialog('steem_connect')

		var username = localStorage.getItem('username');
		var url = 'https://steemconnect.com/sign/custom-json?';

		if (auth_type == 'active') {
			url += 'required_posting_auths=' + encodeURI('[]');
			url += '&required_auths=' + encodeURI('["' + username + '"]');
			url += '&authority=active';
		} else
			url += 'required_posting_auths=' + encodeURI('["' + username + '"]');

		url += '&id=' + Config.CHAIN_ID;
		url += '&json=' + encodeURI(JSON.stringify(data));

		popupCenter(url, 'steemconnect', 500, 560);
		SE._sc_callback = callback;
	},

	SteemConnectJsonId: function (auth_type, id, data, callback) {
		SE.ShowToast(false, 'SteemConnect is deprecated. Please use <a href="https://chrome.google.com/webstore/detail/steem-keychain/lkcjlnjfpbikmcmbachjpdbijejflpcm" target="_blank">Keychain</a>.');
		SE.HideLoading();
		return false;
		SE.HideLoading();
		SE.ShowDialog('steem_connect')

		var username = localStorage.getItem('username');
		var url = 'https://steemconnect.com/sign/custom-json?';

		if (auth_type == 'active') {
			url += 'required_posting_auths=' + encodeURI('[]');
			url += '&required_auths=' + encodeURI('["' + username + '"]');
			url += '&authority=active';
		} else {
			url += 'required_posting_auths=' + encodeURI('["' + username + '"]');
		}

		url += '&id=' + id;
		url += '&json=' + encodeURI(JSON.stringify(data));

		popupCenter(url, 'steemconnect', 500, 560);
		SE._sc_callback = callback;
	},

	SteemConnectTransfer: function (from, to, amount, memo, callback) {
		SE.ShowToast(false, 'SteemConnect is deprecated. Please use <a href="https://chrome.google.com/webstore/detail/steem-keychain/lkcjlnjfpbikmcmbachjpdbijejflpcm" target="_blank">Keychain</a>.');
		SE.HideLoading();
		return false;
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

	SteemConnectCallback: function () {
		if (SE._sc_callback) {
			SE.ShowLoading();

			setTimeout(() => {
				SE.HideLoading();
				SE._sc_callback();
				SE._sc_callback = null;
			}, 10000);
		}
	},

	CheckAccount: function (name, callback) {
		steem.api.getAccounts([name], (e, r) => {
			if (r && r.length > 0)
				callback(r[0]);
			else
				callback(null);
		});
	},

	CheckTransaction(trx_id, retries, callback) {
		ssc.getTransactionInfo(trx_id, (err, result) => {
			if (result) {
				var error = null;

				if (result.logs) {
					var logs = JSON.parse(result.logs);

					if (logs.errors && logs.errors.length > 0)
						error = logs.errors[0];
				}

				if (callback)
					callback(Object.assign(result, { error: error, success: !error }));
			} else if (retries > 0)
				setTimeout(() => SE.CheckTransaction(trx_id, retries - 1, callback), 5000);
			else if (callback)
				callback({ success: false, error: 'Transaction not found.' });
		});
	},

	GetToken: function (symbol) { return SE.Tokens.find(t => t.symbol == symbol); },

	GetDepositAddress: function (symbol, callback) {
		var pegged_token = Config.PEGGED_TOKENS.find(p => p.symbol == symbol);

		if (!pegged_token)
			return;

		$.ajax({
			url: Config.CONVERTER_API + '/convert/',
			type: 'POST',
			data: JSON.stringify({ from_coin: symbol, to_coin: pegged_token.pegged_token_symbol, destination: SE.User.name }),
			contentType: "application/json",
			dataType: "json",
			success: result => {
				if (callback)
					callback(Object.assign(result, pegged_token));
			}
		});
	},

	GetWithdrawalAddress: function (symbol, address, callback) {
		var pegged_token = Config.PEGGED_TOKENS.find(p => p.symbol == symbol);

		if (!pegged_token)
			return;

		$.ajax({
			url: Config.CONVERTER_API + '/convert/',
			type: 'POST',
			data: JSON.stringify({ from_coin: pegged_token.pegged_token_symbol, to_coin: symbol, destination: address }),
			contentType: "application/json",
			dataType: "json",
			error: (xhr, status, errorThrown) => {
				if (callback) {
					callback(xhr, null);
				}
			},
			success: result => {
				if (callback)
					callback(null, Object.assign(result, pegged_token));
			}
		});
	}
}
