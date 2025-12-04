const SelluserManagerABI = 
[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_oldMiningStorage",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "oldMiningStorage",
		"outputs": [
			{
				"internalType": "contract IMiningMachineStorage",
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
			}
		],
		"name": "selluser",
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
				"name": "_newOldMiningStorage",
				"type": "address"
			}
		],
		"name": "setOldMiningStorage",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "val",
				"type": "bool"
			}
		],
		"name": "setSelluser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
export default SelluserManagerABI