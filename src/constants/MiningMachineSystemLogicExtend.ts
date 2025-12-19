const MiningMachineSystemLogicExtendABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_miningMachineSystemStorageAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_miningMachineSystemStorageExtendAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_idxAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_miningMachineSystemLogicAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_miningMachineHistoryExtendAddress",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "IDX",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "activatedPowerLimit",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "activeMachineRewards",
    inputs: [
      {
        name: "_activerAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_activeCounts",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addFriend",
    inputs: [
      {
        name: "_introducer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addRewardForAddressByFuelFee",
    inputs: [
      {
        name: "_fuelFee",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_address",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "airdrop",
    inputs: [
      {
        name: "_recipient",
        type: "address",
        internalType: "address",
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "authorizedCallers",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateActivatedMachineRewards",
    inputs: [
      {
        name: "_address",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateRewardRate",
    inputs: [
      {
        name: "_address",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimActivatedMachineRewards",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRewards",
    inputs: [
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getFriendCount",
    inputs: [
      {
        name: "_introducer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFriendList",
    inputs: [
      {
        name: "_introducer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getIntroducerChain",
    inputs: [
      {
        name: "_friend",
        type: "address",
        internalType: "address",
      },
      {
        name: "_levels",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAirdroper",
    inputs: [
      {
        name: "_address",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "miningMachineHistoryExtend",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "miningMachineSystemStorageExtend",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "mintChildMachine",
    inputs: [
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "count",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "perLevelPromotionLimit",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "promotionPowerLimit",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setActivatedPowerLimit",
    inputs: [
      {
        name: "_limit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setAuthorizedCaller",
    inputs: [
      {
        name: "_address",
        type: "address",
        internalType: "address",
      },
      {
        name: "_status",
        type: "bool",
        internalType: "bool",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setHistoryExtendAddress",
    inputs: [
      {
        name: "_miningMachineHistoryExtendAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setPerLevelPromotionLimit",
    inputs: [
      {
        name: "_limit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setPromotionPowerLimit",
    inputs: [
      {
        name: "_limit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setStorageAddress",
    inputs: [
      {
        name: "_miningMachineSystemStorageAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setStorageExtendAddress",
    inputs: [
      {
        name: "_miningMachineSystemStorageExtendAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setSystemLogicAddress",
    inputs: [
      {
        name: "_miningMachineSystemLogicAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "store",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract MiningMachineSystemStorage",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "systemLogic",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdrawIDX",
    inputs: [
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export default MiningMachineSystemLogicExtendABI;
