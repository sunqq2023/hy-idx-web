const MiningMachineHistoryExtendABI =
    [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_user",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_getAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_recordType",
                    "type": "uint256"
                }
            ],
            "name": "recordGetPower",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_user",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_claimType",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_claimAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_tokenType",
                    "type": "uint256"
                }
            ],
            "name": "recordRewardClaim",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_address",
                    "type": "address"
                },
                {
                    "internalType": "bool",
                    "name": "_status",
                    "type": "bool"
                }
            ],
            "name": "setAuthorizedCaller",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_storageAddress",
                    "type": "address"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "user",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "claimType",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "claimDate",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "claimAmount",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "tokenType",
                    "type": "uint256"
                }
            ],
            "name": "RewardClaimRecorded",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_storageAddress",
                    "type": "address"
                }
            ],
            "name": "setStoreAddress",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "authorizedCallers",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_user",
                    "type": "address"
                }
            ],
            "name": "getUserClaimRecordCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_user",
                    "type": "address"
                }
            ],
            "name": "getUserClaimRecords",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "claimType",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "claimDate",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "claimAmount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "tokenType",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct MiningMachineHistoryExtend.RewardClaimRecord[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_user",
                    "type": "address"
                }
            ],
            "name": "getUserGetPowerRecordCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_user",
                    "type": "address"
                }
            ],
            "name": "getUserGetPowerRecords",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "getDate",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "getAmount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "recordType",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct MiningMachineHistoryExtend.GetPowerRecord[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "store",
            "outputs": [
                {
                    "internalType": "contract MiningMachineSystemStorage",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "userClaimRecords",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "claimType",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "claimDate",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "claimAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenType",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "userGetPowerRecords",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "getDate",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "getAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "recordType",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]

export default MiningMachineHistoryExtendABI
