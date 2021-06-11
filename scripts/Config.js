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
        pegged_token_symbol: 'STEEMP',
        withdraw_disabled: false
    },
    {
        name: 'HIVE',
        symbol: 'HIVE',
        pegged_token_symbol: 'HIVEP',
        withdraw_disabled: false
    },
    {
        name: 'Bitcoin',
        symbol: 'BTC',
        pegged_token_symbol: 'BTCP',
        withdraw_disabled: false
    },
    {
        name: 'Litecoin',
        symbol: 'LTC',
        pegged_token_symbol: 'LTCP',
        withdraw_disabled: false
    },
    {
        name: 'EOS',
        symbol: 'EOS',
        pegged_token_symbol: 'EOSP',
        withdraw_disabled: true,
        withdraw_disable_reason: "EOS and EOS token withdrawals are temporarily disabled while EOS CPU costs are excessive."
    },
    {
        name: 'EOS Steem Pegged',
        symbol: 'EOSSTEEM',
        pegged_token_symbol: 'STEEMP',
        withdraw_disabled: false
    },
    {
        name: 'Golos',
        symbol: 'GOLOS',
        pegged_token_symbol: 'GOLOSP',
        withdraw_disabled: false
    },
    {
        name: 'Swift Cash',
        symbol: 'SWIFT',
        pegged_token_symbol: 'SWIFTP',
        withdraw_disabled: false
    },
    {
        name: 'BitShares',
        symbol: 'BTS',
        pegged_token_symbol: 'BTSP',
        withdraw_disabled: false
    },
    {
        name: 'Weku',
        symbol: 'WEKU',
        pegged_token_symbol: 'WEKUP',
        withdraw_disabled: false
    },
    {
        name: 'BitShares USD',
        symbol: 'BTSUSD',
        pegged_token_symbol: 'BTSUSDP',
        withdraw_disabled: false
    }, {
        name: 'BitShares CNY',
        symbol: 'BTSCNY',
        pegged_token_symbol: 'BTSCNYP',
        withdraw_disabled: false
    },
    {
        name: 'BitShares BTC Bridge',
        symbol: 'BTSBRIDGE.BTC',
        pegged_token_symbol: 'BRIDGEBTCP',
        withdraw_disabled: false
    },
    {
        name: 'Crypto Peso',
        symbol: 'PSO',
        pegged_token_symbol: 'PSOP',
        withdraw_disabled: false
    },
    {
        name: 'Vision Industry Token',
        symbol: 'VIT',
        pegged_token_symbol: 'VITP',
        withdraw_disabled: false
    },
    {
        name: 'ANX',
        symbol: 'ANX',
        pegged_token_symbol: 'ANXP',
        withdraw_disabled: false
    },
    {
        name: 'Bitcoin Cash',
        symbol: 'BCH',
        pegged_token_symbol: 'BCHP',
        withdraw_disabled: false
    },
    {
        name: 'Dogecoin',
        symbol: 'DOGE',
        pegged_token_symbol: 'DOGEP',
        withdraw_disabled: false
    },
    {
        name: 'pEOS',
        symbol: 'EOSPEOS',
        pegged_token_symbol: 'PEOSP',
        withdraw_disabled: true,
        withdraw_disable_reason: "EOS and EOS token withdrawals are temporarily disabled while EOS CPU costs are excessive."
    },
    {
        name: 'Challenge EOS',
        symbol: 'EOSCHL',
        pegged_token_symbol: 'CHLP',
        withdraw_disabled: true,
        withdraw_disable_reason: "EOS and EOS token withdrawals are temporarily disabled while EOS CPU costs are excessive."
    },
    {
        name: "TELOS (TELOS Network)",
        symbol: "TLOS",
        pegged_token_symbol: "TLOSP",
        withdraw_disabled: false
    },
    {
        name: "EOS One Thousand Coin",
        symbol: "OTC",
        pegged_token_symbol: "OTT",
        withdraw_disabled: true,
        withdraw_disable_reason: "EOS and EOS token withdrawals are temporarily disabled while EOS CPU costs are excessive."
    }
    ]
}
