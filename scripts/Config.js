Config = {
    MAINTENANCE_MODE: false,
    CHAIN_ID: 'ssc-mainnet1',
    RPC_URL: 'https://api.steem-engine.net/rpc2',
    ACCOUNTS_API_URL: 'https://api.steem-engine.net/accounts',
    CONVERTER_API: 'https://converter-api.steem-engine.net/api',
    SCOT_API: 'https://scot-api.hive-engine.com/',
    NODE_API: 'https://node-api.steem-engine.net/v1/',
    HISTORY_API: 'https://api.steem-engine.net/history/',
    NATIVE_TOKEN: 'ENG',
    STEEMP_ACCOUNT: 'steem-peg',
    DISABLED_TOKENS: ['BTC', 'LTC', 'STEEM', 'SBD', 'BCC', 'XAP', 'XRP', 'GOLOS', 'DISNEY', 'AMAZON', 'VOICE', 'ETH', 'EOS', 'LASSE', 'TIME', 'R', 'SCTR', 'ALLAH', 'DONE', 'BNB', 'ETHER', 'LTCPEG', 'SBC', 'LASSECASH', 'HIVE', 'TIX', 'TIXM', 'STEM', 'STEMM', 'LEO', 'LEOM', 'LEOMM', 'NEO', 'NEOX', 'PORN', 'SPORTS', 'BATTLE', 'SIM', 'CTP', 'CTPM', 'EMFOUR', 'CCC', 'CCCM', 'BEER', 'WEED', 'WEEDM', 'WEEDMM', 'SPACO', 'SPACOM', 'NEOXAG', 'NEOXAGM', 'KANDA', 'SAND', 'INFOWARS', 'SPI', 'PAL', 'PALM', 'PALMM', 'ENGAGE', 'BRO', 'CC', 'BUILDTEAM', 'ECO', 'GAMER', 'EPC', 'SPT', 'JAHM','USDT','APX','APXM','ENJ','DOGE','BTS','TKO'],
    MARKET_HIDE_TOKENS: ['SMTT'],
    PEGGED_TOKEN: 'STEEMP',
    PEGGED_TOKENS: [{
            name: 'STEEM',
            symbol: 'STEEM',
            pegged_token_symbol: 'STEEMP'
        },
        {
            name: 'HIVE',
            symbol: 'HIVE',
            pegged_token_symbol: 'HIVEP'
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
            name: 'EOS Steem Pegged',
            symbol: 'EOSSTEEM',
            pegged_token_symbol: 'STEEMP'
        },
        {
            name: 'Golos',
            symbol: 'GOLOS',
            pegged_token_symbol: 'GOLOSP'
        },
        {
            name: 'Swift Cash',
            symbol: 'SWIFT',
            pegged_token_symbol: 'SWIFTP'
        },
        {
            name: 'BitShares',
            symbol: 'BTS',
            pegged_token_symbol: 'BTSP'
        },
        {
            name: 'Weku',
            symbol: 'WEKU',
            pegged_token_symbol: 'WEKUP'
        },
        {
            name: 'BitShares USD',
            symbol: 'BTSUSD',
            pegged_token_symbol: 'BTSUSDP'
        }, {
            name: 'BitShares CNY',
            symbol: 'BTSCNY',
            pegged_token_symbol: 'BTSCNYP'
        },
        {
            name: 'BitShares BTC Bridge',
            symbol: 'BTSBRIDGE.BTC',
            pegged_token_symbol: 'BRIDGEBTCP'
        },
        {
            name: 'Crypto Peso',
            symbol: 'PSO',
            pegged_token_symbol: 'PSOP'
        },
        {
            name: 'Vision Industry Token',
            symbol: 'VIT',
            pegged_token_symbol: 'VITP'
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
        },
        {
            name: 'pEOS',
            symbol: 'EOSPEOS',
            pegged_token_symbol: 'PEOSP'
        },
        {
            name: 'Challenge EOS',
            symbol: 'EOSCHL',
            pegged_token_symbol: 'CHLP'
        },
        {
            name: "TELOS (TELOS Network)",
            symbol: "TLOS",
            pegged_token_symbol: "TLOSP"
        },
        {
            name: "EOS One Thousand Coin",
            symbol: "OTC",
            pegged_token_symbol: "OTT"
        },
        {
            name: 'WAX',
            symbol: 'WAX',
            pegged_token_symbol: 'SWAP.WAX'
        }
    ],
    DISABLED_DEPOSITS: [{
        symbol: 'BTC',
        reason: 'BTC deposits have been disabled temporally due to technical difficulties.'
    }],
    DISABLED_WITHDRAWALS: [{
        symbol: 'BTCP',
        reason: 'BTC deposits have been disabled temporally due to technical difficulties.'
    }],
    MINIMUM_WITHDRAWALS: [
        {
            symbol: 'BTCP',
            amount: 0.01
        }, {
            symbol: 'DOGEP',
            amount: 10
        }
    ]
}
