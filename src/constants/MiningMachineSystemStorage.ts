const MiningMachineSystemStorageABI = 
				[
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_idx",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_usdt",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_router",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_platformWallet",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_sadmin",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_logicAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "_isOnSale",
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
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        }
      ],
      "name": "activateMachine",
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
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "addMixBalance",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "batchInfos",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "batchId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "uint16",
          "name": "commissionRate",
          "type": "uint16"
        },
        {
          "internalType": "address",
          "name": "distributor",
          "type": "address"
        },
        {
          "internalType": "uint40",
          "name": "creatTime",
          "type": "uint40"
        },
        {
          "internalType": "uint256",
          "name": "minted",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "batchSaleOrders",
      "outputs": [
        {
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "totalIdxAmount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "paid",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "childSellTimestamp",
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
      "inputs": [],
      "name": "commissionWallet",
      "outputs": [
        {
          "internalType": "address",
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
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        }
      ],
      "name": "deactivateMachine",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        }
      ],
      "name": "deleteChildSellTimestamp",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "batchId",
          "type": "uint256"
        }
      ],
      "name": "getBatchInfo",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "batchId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "price",
              "type": "uint256"
            },
            {
              "internalType": "uint16",
              "name": "commissionRate",
              "type": "uint16"
            },
            {
              "internalType": "address",
              "name": "distributor",
              "type": "address"
            },
            {
              "internalType": "uint40",
              "name": "creatTime",
              "type": "uint40"
            },
            {
              "internalType": "uint256",
              "name": "minted",
              "type": "uint256"
            }
          ],
          "internalType": "struct MiningMachineSystemStorage.BatchInfo",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        }
      ],
      "name": "getBatchSaleOrder",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "seller",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "internalType": "uint256[]",
              "name": "machineIds",
              "type": "uint256[]"
            },
            {
              "internalType": "uint256",
              "name": "totalIdxAmount",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "paid",
              "type": "bool"
            }
          ],
          "internalType": "struct MiningMachineSystemStorage.BatchSaleOrder",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        }
      ],
      "name": "getMachine",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "batchId",
              "type": "uint256"
            }
          ],
          "internalType": "struct MiningMachineSystemStorage.TokenInfo",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        }
      ],
      "name": "getMachineLifecycle",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "createTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "activatedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "expiredAt",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "mtype",
              "type": "uint8"
            },
            {
              "internalType": "bool",
              "name": "isActivatedStakedLP",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "isFuelPaid",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "isProducing",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "destroyed",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "producedHours",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lastProduceTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "producedChildCount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "fuelRemainingMinutes",
              "type": "uint256"
            }
          ],
          "internalType": "struct MiningMachineSystemStorage.MachineLifecycle",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "getOwnerToMachineIds",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "idxToken",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "idxUsdtPair",
      "outputs": [
        {
          "internalType": "address",
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
          "internalType": "uint256",
          "name": "batchId",
          "type": "uint256"
        }
      ],
      "name": "incrementBatchMinted",
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
      "name": "isMotherMachineDistributor",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "lastRewardTs",
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
      "inputs": [],
      "name": "logicAddress",
      "outputs": [
        {
          "internalType": "address",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "machineLifecycles",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "createTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "activatedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "expiredAt",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "mtype",
          "type": "uint8"
        },
        {
          "internalType": "bool",
          "name": "isActivatedStakedLP",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isFuelPaid",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isProducing",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "destroyed",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "producedHours",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastProduceTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "producedChildCount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "fuelRemainingMinutes",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "machineToBatchSaleOrderId",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "machines",
      "outputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "batchId",
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
        }
      ],
      "name": "mixBalances",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "motherMachinePrices",
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
      "inputs": [],
      "name": "nextBatchId",
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
      "inputs": [],
      "name": "nextMachineId",
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
      "inputs": [],
      "name": "nodeAddress",
      "outputs": [
        {
          "internalType": "address",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "orders",
      "outputs": [
        {
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "price",
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
      "name": "ownerToMachineIds",
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
      "inputs": [],
      "name": "pancakeRouter",
      "outputs": [
        {
          "internalType": "address",
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
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        }
      ],
      "name": "payFuel",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "platformWallet",
      "outputs": [
        {
          "internalType": "address",
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
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "produceMix",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "productAddress",
      "outputs": [
        {
          "internalType": "address",
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
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "pushOwnerToMachineId",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        }
      ],
      "name": "removeMachineFromOwner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "sadmin",
      "outputs": [
        {
          "internalType": "address",
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
          "internalType": "uint256",
          "name": "batchId",
          "type": "uint256"
        },
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "batchId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "price",
              "type": "uint256"
            },
            {
              "internalType": "uint16",
              "name": "commissionRate",
              "type": "uint16"
            },
            {
              "internalType": "address",
              "name": "distributor",
              "type": "address"
            },
            {
              "internalType": "uint40",
              "name": "creatTime",
              "type": "uint40"
            },
            {
              "internalType": "uint256",
              "name": "minted",
              "type": "uint256"
            }
          ],
          "internalType": "struct MiningMachineSystemStorage.BatchInfo",
          "name": "info",
          "type": "tuple"
        }
      ],
      "name": "setBatchInfo",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "seller",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "internalType": "uint256[]",
              "name": "machineIds",
              "type": "uint256[]"
            },
            {
              "internalType": "uint256",
              "name": "totalIdxAmount",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "paid",
              "type": "bool"
            }
          ],
          "internalType": "struct MiningMachineSystemStorage.BatchSaleOrder",
          "name": "order",
          "type": "tuple"
        }
      ],
      "name": "setBatchSaleOrder",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "paid",
          "type": "bool"
        }
      ],
      "name": "setBatchSaleOrderPaid",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "ts",
          "type": "uint256"
        }
      ],
      "name": "setChildSellTimestamp",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newWallet",
          "type": "address"
        }
      ],
      "name": "setCommissionWallet",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newIdx",
          "type": "address"
        }
      ],
      "name": "setIdxToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "pair",
          "type": "address"
        }
      ],
      "name": "setIdxUsdtPair",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "ts",
          "type": "uint256"
        }
      ],
      "name": "setLastRewardTs",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_logicAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_productAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_nodeAddress",
          "type": "address"
        }
      ],
      "name": "setLogicAddress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "batchId",
              "type": "uint256"
            }
          ],
          "internalType": "struct MiningMachineSystemStorage.TokenInfo",
          "name": "info",
          "type": "tuple"
        }
      ],
      "name": "setMachine",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "createTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "activatedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "expiredAt",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "mtype",
              "type": "uint8"
            },
            {
              "internalType": "bool",
              "name": "isActivatedStakedLP",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "isFuelPaid",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "isProducing",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "destroyed",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "producedHours",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lastProduceTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "producedChildCount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "fuelRemainingMinutes",
              "type": "uint256"
            }
          ],
          "internalType": "struct MiningMachineSystemStorage.MachineLifecycle",
          "name": "info",
          "type": "tuple"
        }
      ],
      "name": "setMachineLifecycle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "onSale",
          "type": "bool"
        }
      ],
      "name": "setMachineOnSale",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        }
      ],
      "name": "setMachineToBatchSaleOrderId",
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
      "name": "setMotherMachineDistributor",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "setMotherMachinePrice",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "val",
          "type": "uint256"
        }
      ],
      "name": "setNextBatchId",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "val",
          "type": "uint256"
        }
      ],
      "name": "setNextMachineId",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "seller",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "price",
              "type": "uint256"
            }
          ],
          "internalType": "struct MiningMachineSystemStorage.DirectOrder",
          "name": "order",
          "type": "tuple"
        }
      ],
      "name": "setOrder",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newRouter",
          "type": "address"
        }
      ],
      "name": "setPancakeRouter",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newWallet",
          "type": "address"
        }
      ],
      "name": "setPlatformWallet",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_sadmin",
          "type": "address"
        }
      ],
      "name": "setSadmin",
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
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "machineId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "setStakedLPAmount",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newUsdt",
          "type": "address"
        }
      ],
      "name": "setUsdtToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "stakedLPAmount",
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
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "subMixBalance",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "usdtToken",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]

export default MiningMachineSystemStorageABI
