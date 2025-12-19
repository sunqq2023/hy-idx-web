《MiningMachineSystemStorage 合约接口说明》

合约概述

`MiningMachineSystemStorage` 是矿机系统的存储合约，负责所有核心数据的持久化存储，包括矿机信息、批次信息、订单数据、用户资产等。该合约仅允许授权的逻辑合约（`logicAddress`）和生产合约（`productAddress`）进行数据修改，确保数据操作的安全性和一致性。

核心数据结构

| 结构名&#xA;        | 字段&#xA;              | 说明&#xA;                                      |
| ------------------ | ---------------------- | ---------------------------------------------- |
| `TokenInfo`        | `owner`                | 矿机所有者地址&#xA;                            |
|                    | `batchId`              | 所属批次 ID&#xA;                               |
| `MachineLifecycle` | `createTime`           | 创建时间戳&#xA;                                |
|                    | `activatedAt`          | 激活时间戳&#xA;                                |
|                    | `expiredAt`            | 过期时间戳&#xA;                                |
|                    | `mtype`                | 矿机类型（1 = 母机，2 = 子机）&#xA;            |
|                    | `isActivatedStakedLP`  | 是否激活 LP 质押&#xA;                          |
|                    | `isFuelPaid`           | 是否已支付燃料&#xA;                            |
|                    | `isProducing`          | 是否正在生产&#xA;                              |
|                    | `destroyed`            | 是否已销毁&#xA;                                |
|                    | `producedHours`        | 累计生产分钟数（名称为 hours 实际为分钟）&#xA; |
|                    | `lastProduceTime`      | 上次生产时间戳&#xA;                            |
|                    | `producedChildCount`   | 母机已产子机数量&#xA;                          |
|                    | `fuelRemainingMinutes` | 剩余燃料分钟数&#xA;                            |
| `BatchInfo`        | `batchId`              | 批次 ID&#xA;                                   |
|                    | `price`                | 单价&#xA;                                      |
|                    | `commissionRate`       | 佣金比例&#xA;                                  |
|                    | `distributor`          | 经销商地址&#xA;                                |
|                    | `creatTime`            | 创建时间戳&#xA;                                |
|                    | `minted`               | 已铸造数量&#xA;                                |
| `DirectOrder`      | `seller`               | 卖家地址&#xA;                                  |
|                    | `buyer`                | 买家地址&#xA;                                  |
|                    | `price`                | 价格&#xA;                                      |
| `BatchSaleOrder`   | `seller`               | 卖家地址&#xA;                                  |
|                    | `buyer`                | 买家地址&#xA;                                  |
|                    | `machineIds`           | 矿机 ID 列表&#xA;                              |
|                    | `totalIdxAmount`       | 总 IDX 金额&#xA;                               |
|                    | `paid`                 | 是否已支付&#xA;                                |

主要状态变量

| 变量名&#xA;                  | 类型&#xA;                              | 说明&#xA;                             |
| ---------------------------- | -------------------------------------- | ------------------------------------- |
| `nextMachineId`              | `uint256`                              | 下一个矿机 ID 计数器&#xA;             |
| `nextBatchId`                | `uint256`                              | 下一个批次 ID 计数器&#xA;             |
| `machines`                   | `mapping(uint256 => TokenInfo)`        | 矿机信息映射（ID→ 信息）&#xA;         |
| `ownerToMachineIds`          | `mapping(address => uint256[])`        | 所有者到矿机 ID 列表的映射&#xA;       |
| `machineLifecycles`          | `mapping(uint256 => MachineLifecycle)` | 矿机生命周期映射（ID→ 生命周期）&#xA; |
| `batchInfos`                 | `mapping(uint256 => BatchInfo)`        | 批次信息映射（ID→ 信息）&#xA;         |
| `mixBalances`                | `mapping(address => uint256)`          | 用户 MIX 余额映射&#xA;                |
| `orders`                     | `mapping(uint256 => DirectOrder)`      | 直接订单映射（矿机 ID→ 订单）&#xA;    |
| `childSellTimestamp`         | `mapping(uint256 => uint256)`          | 子矿机上架时间戳映射&#xA;             |
| `stakedLPAmount`             | `mapping(uint256 => uint256)`          | 矿机质押的 LP 数量映射&#xA;           |
| `_isOnSale`                  | `mapping(uint256 => bool)`             | 矿机是否上架映射&#xA;                 |
| `idxToken`                   | `address`                              | IDX 代币地址&#xA;                     |
| `usdtToken`                  | `address`                              | USDT 代币地址&#xA;                    |
| `pancakeRouter`              | `address`                              | PancakeSwap 路由地址&#xA;             |
| `platformWallet`             | `address`                              | 平台钱包地址&#xA;                     |
| `sadmin`                     | `address`                              | 超级管理员地址&#xA;                   |
| `logicAddress`               | `address`                              | 逻辑合约地址&#xA;                     |
| `productAddress`             | `address`                              | 生产合约地址&#xA;                     |
| `idxUsdtPair`                | `address`                              | IDX-USDT 交易对地址&#xA;              |
| `isMotherMachineDistributor` | `mapping(address => bool)`             | 是否为母矿机经销商映射&#xA;           |

主要接口说明

### 1. 权限控制修饰符&#xA;

| 修饰符&#xA;  | 说明&#xA;                                                               |
| ------------ | ----------------------------------------------------------------------- |
| `onlyLogic`  | 仅允许逻辑合约（`logicAddress`）或生产合约（`productAddress`）调用&#xA; |
| `onlySadmin` | 仅允许超级管理员（`sadmin`）调用&#xA;                                   |

### 2. 矿机激活与管理&#xA;

#### `activateMachine(uint256 machineId) external onlyLogic`

- **功能**：激活矿机，开始生产。

- **参数**：`machineId` - 矿机 ID

- **权限**：仅授权的逻辑或生产合约

- **限制**：矿机未处于激活状态

- **逻辑**：

  - 设置矿机为激活状态

  - 记录激活时间戳

  - 若为母矿机，设置为生产中状态

#### `deactivateMachine(uint256 machineId) external onlyLogic`

- **功能**：停用矿机，停止生产。

- **参数**：`machineId` - 矿机 ID

- **权限**：仅授权的逻辑或生产合约

- **限制**：矿机处于激活状态

- **逻辑**：

  - 设置矿机为未激活状态

  - 设置为未生产状态

#### `payFuel(uint256 machineId) external onlyLogic`

- **功能**：为子矿机支付燃料，延长生产时间。

- **参数**：`machineId` - 子矿机 ID

- **权限**：仅授权的逻辑或生产合约

- **限制**：

  - 必须是子矿机（类型为 2）

  - 矿机已激活

- **逻辑**：

  - 增加 30 分钟剩余燃料时间

  - 设置为已支付燃料状态

  - 设置为生产中状态

### 3. 生产与奖励&#xA;

#### `produceMix(address user, uint256 machineId, uint256 amount) external onlyLogic`

- **功能**：记录子矿机生产的 MIX 奖励，增加用户余额。

- **参数**：

  - `user`：用户地址

  - `machineId`：矿机 ID

  - `amount`：生产的 MIX 数量

- **权限**：仅授权的逻辑或生产合约

- **限制**：矿机处于生产中状态

- **逻辑**：

  - 增加用户的 MIX 余额

  - 更新矿机上次奖励时间戳

### 4. 配置管理&#xA;

#### `setLogicAddress(address _logicAddress, address _productAddress) external onlySadmin`

- **功能**：设置逻辑合约和生产合约地址。

- **参数**：

  - `_logicAddress`：逻辑合约地址

  - `_productAddress`：生产合约地址

- **权限**：仅超级管理员

- **限制**：逻辑合约地址不为 0

#### `setSadmin(address _sadmin) external onlySadmin`

- **功能**：设置超级管理员地址。

- **参数**：`_sadmin` - 新超级管理员地址

- **权限**：仅当前超级管理员

- **限制**：新地址不为 0

#### `setPlatformWallet(address newWallet) external onlySadmin`

- **功能**：设置平台钱包地址。

- **参数**：`newWallet` - 新平台钱包地址

- **权限**：仅超级管理员

- **限制**：新地址不为 0

#### `setIdxToken(address newIdx) external onlySadmin`

- **功能**：设置 IDX 代币地址。

- **参数**：`newIdx` - 新 IDX 代币地址

- **权限**：仅超级管理员

- **限制**：新地址不为 0

#### `setIdxUsdtPair(address pair) external onlySadmin`

- **功能**：设置 IDX-USDT 交易对地址。

- **参数**：`pair` - 交易对地址

- **权限**：仅超级管理员

- **限制**：新地址不为 0

### 5. 数据存储操作&#xA;

#### `setMachine(uint256 id, TokenInfo calldata info) external onlyLogic`

- **功能**：设置矿机信息。

- **参数**：

  - `id`：矿机 ID

  - `info`：矿机信息

- **权限**：仅授权的逻辑或生产合约

#### `setMachineLifecycle(uint256 id, MachineLifecycle calldata info) external onlyLogic`

- **功能**：设置矿机生命周期信息。

- **参数**：

  - `id`：矿机 ID

  - `info`：生命周期信息

- **权限**：仅授权的逻辑或生产合约

#### `setBatchInfo(uint256 batchId, BatchInfo calldata info) external onlyLogic`

- **功能**：设置批次信息。

- **参数**：

  - `batchId`：批次 ID

  - `info`：批次信息

- **权限**：仅授权的逻辑或生产合约

#### `pushOwnerToMachineId(address owner, uint256 id) external onlyLogic`

- **功能**：将矿机 ID 添加到所有者的矿机列表中。

- **参数**：

  - `owner`：所有者地址

  - `id`：矿机 ID

- **权限**：仅授权的逻辑或生产合约

#### `removeMachineFromOwner(address owner, uint256 machineId) external onlyLogic`

- **功能**：从所有者的矿机列表中移除指定矿机 ID。

- **参数**：

  - `owner`：所有者地址

  - `machineId`：矿机 ID

- **权限**：仅授权的逻辑或生产合约

- **逻辑**：通过替换最后一个元素并删除末尾的方式高效移除

### 6. 订单与交易管理&#xA;

#### `setOrder(uint256 machineId, DirectOrder calldata order) external onlyLogic`

- **功能**：设置矿机的直接订单。

- **参数**：

  - `machineId`：矿机 ID

  - `order`：订单信息

- **权限**：仅授权的逻辑或生产合约

#### `deleteOrder(uint256 machineId) external onlyLogic`

- **功能**：删除矿机的直接订单。

- **参数**：`machineId` - 矿机 ID

- **权限**：仅授权的逻辑或生产合约

#### `setBatchSaleOrder(uint256 orderId, BatchSaleOrder calldata order) external onlyLogic`

- **功能**：设置批次销售订单。

- **参数**：

  - `orderId`：订单 ID

  - `order`：订单信息

- **权限**：仅授权的逻辑或生产合约

#### `setMachineOnSale(uint256 machineId, bool onSale) external onlyLogic`

- **功能**：设置矿机是否上架。

- **参数**：

  - `machineId`：矿机 ID

  - `onSale`：是否上架（true = 上架，false = 下架）

- **权限**：仅授权的逻辑或生产合约

### 7. 余额操作&#xA;

#### `addMixBalance(address user, uint256 amount) external onlyLogic`

- **功能**：增加用户的 MIX 余额。

- **参数**：

  - `user`：用户地址

  - `amount`：增加的数量

- **权限**：仅授权的逻辑或生产合约

#### `subMixBalance(address user, uint256 amount) external onlyLogic`

- **功能**：减少用户的 MIX 余额。

- **参数**：

  - `user`：用户地址

  - `amount`：减少的数量

- **权限**：仅授权的逻辑或生产合约

- **限制**：用户余额不小于减少的数量

### 8. 信息查询&#xA;

#### `getMachineLifecycle(uint256 machineId) external view returns (MachineLifecycle memory)`

- **功能**：查询矿机的生命周期信息。

- **参数**：`machineId` - 矿机 ID

- **返回值**：矿机生命周期结构体

#### `getMachine(uint256 machineId) external view returns (TokenInfo memory)`

- **功能**：查询矿机的基本信息。

- **参数**：`machineId` - 矿机 ID

- **返回值**：矿机信息结构体

#### `getBatchInfo(uint256 batchId) external view returns (BatchInfo memory)`

- **功能**：查询批次信息。

- **参数**：`batchId` - 批次 ID

- **返回值**：批次信息结构体

#### `getOwnerToMachineIds(address owner) external view returns (uint256[] memory)`

- **功能**：查询指定所有者的矿机 ID 列表。

- **参数**：`owner` - 所有者地址

- **返回值**：矿机 ID 数组

核心功能总结

`MiningMachineSystemStorage` 作为矿机系统的存储层，提供了以下核心能力：

1.  矿机全生命周期数据存储：包括基本信息、状态、生产记录等

2.  批次管理：支持矿机批次的创建和信息查询

3.  订单与交易数据管理：存储直接订单和批次销售订单信息

4.  用户资产记录：维护用户的 MIX 余额和矿机所有权关系

5.  权限控制：仅允许授权合约修改数据，确保数据安全性

该合约通过暴露一系列`set`、`get`方法，为上层逻辑合约提供数据访问接口，实现了业务逻辑与数据存储的分离，提高了系统的可维护性和扩展性。

>
