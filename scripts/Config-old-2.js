Config = {
	MAINTENANCE_MODE: false,
	CHAIN_ID: 'ssc-mainnet1',
	RPC_URL: 'https://api.steem-engine.com/rpc',
	ACCOUNTS_API_URL: 'https://api.steem-engine.com/accounts',
	CONVERTER_API: 'https://converter-api.steem-engine.com/api',
	NATIVE_TOKEN: 'ENG',
	STEEMP_ACCOUNT: 'steem-peg',
	DISABLED_TOKENS: ['BTC', 'STEEM', 'SBD', 'BCC'],
	PEGGED_TOKEN: 'STEEMP',
	PEGGED_TOKENS: [
		{
			name: 'STEEM',
			symbol: 'STEEM',
			pegged_token_symbol: 'STEEMP'
		},
		{
			name: 'Bitcoin',
			symbol: 'BTC',
			pegged_token_symbol: 'BTCP'
		},
		{
			name: 'Litecoin',
			symbol: 'LTC',
			pegged_token_symbol: 'LTCP'
		},
		{
			name: 'Bitcoin Cash',
			symbol: 'BCH',
			pegged_token_symbol: 'BCHP'
		},
		{
			name: 'Dogecoin',
			symbol: 'DOGE',
			pegged_token_symbol: 'DOGEP'
		}
	]
}
