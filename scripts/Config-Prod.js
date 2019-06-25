Config = {
	MAINTENANCE_MODE: false,
	CHAIN_ID: 'ssc-mainnet1',
	RPC_URL: 'https://api.steem-engine.com/rpc',
	ACCOUNTS_API_URL: 'https://api.steem-engine.com/accounts',
	CONVERTER_API: 'https://converter-api.steem-engine.com/api',
	SCOT_API: 'https://scot-api.steem-engine.com/',
	NODE_API: 'https://node-api.steem-engine.com/v1/',
	NATIVE_TOKEN: 'ENG',
	STEEMP_ACCOUNT: 'steem-peg',
	DISABLED_TOKENS: ['BTC', 'LTC', 'STEEM', 'SBD', 'BCC', 'XAP', 'XRP', 'GOLOS', 'DISNEY', 'AMAZON', 'VOICE', 'ETH', 'EOS'],
	PEGGED_TOKEN: 'STEEMP',
	PEGGED_TOKENS: [
		{
			name: 'Steem',
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
			name: 'EOS',
			symbol: 'EOS',
			pegged_token_symbol: 'EOSP'
		}, 
		{
			name: 'Crypto Peso',
			symbol: 'PSO',
			pegged_token_symbol: 'PSOP'
		},
		{
			name: 'ANX',
			symbol: 'ANX',
			pegged_token_symbol: 'ANXP'
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