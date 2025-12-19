《MiningMachineSystemLogic 合约接口说明》

合约概述

`MiningMachineSystemLogic` 是矿机系统的核心逻辑合约，负责矿机的铸造、激活、交易、上架等核心功能，支持母矿机和子矿机的管理，以及相关的费用计算和订单处理。该合约与存储合约（`MiningMachineSystemStorage`）和历史记录合约（`MiningMachineHistory`）交互，实现数据的持久化存储和操作记录的追踪。

核心数据结构

| 结构名&#xA;     | 字段&#xA;    | 说明&#xA;                                                         |
| --------------- | ------------ | ----------------------------------------------------------------- |
| `InternalOrder` | `seller`     | 卖家地址&#xA;                                                     |
|                 | `buyer`      | 买家地址&#xA;                                                     |
|                 | `price`      | 以 USD 为单位的总价格&#xA;                                        |
|                 | `setTime`    | 订单创建时间戳&#xA;                                               |
|                 | `machineIds` | 订单包含的矿机 ID 列表&#xA;                                       |
|                 | `status`     | 订单状态（0 = 待成交，1 = 已成交，2 = 已撤销）&#xA;               |
| `ListedOrder`   | `orderId`    | 订单 ID&#xA;                                                      |
|                 | `machineId`  | 矿机 ID&#xA;                                                      |
|                 | `seller`     | 卖家地址&#xA;                                                     |
|                 | `price`      | 以 IDX 为单位的价格&#xA;                                          |
|                 | `listedAt`   | 上架时间戳&#xA;                                                   |
|                 | `status`     | 订单状态（0 = 有效，1 = 已成交，2 = 已取消，3 = 已售给平台）&#xA; |

常量与变量说明

| 名称&#xA;                  | 类型&#xA;         | 说明&#xA;                            |
| -------------------------- | ----------------- | ------------------------------------ |
| `TOTAL_PRODUCTION_MINUTES` | 常量 uint256&#xA; | 子矿机总生产分钟数，值为 365&#xA;    |
| `PLATFORM_FEE_USD`         | 变量 uint256&#xA; | 平台费用（USD），默认 110&#xA;       |
| `SELLER_INCOME_USD`        | 变量 uint256&#xA; | 卖家收入（USD），默认 40&#xA;        |
| `CHILD_MACHINE_PRICE`      | 变量 uint256&#xA; | 子矿机基础价格（USD），默认 150&#xA; |
| `lpUsd`                    | 变量 uint256&#xA; | LP 相关费用（USD），默认 15&#xA;     |
| `activeListedOrderCount`   | 变量 uint256&#xA; | 活跃的上架订单数量&#xA;              |

主要接口说明

### 1. 矿机铸造&#xA;

#### `batchMintMotherMachine(uint256 count, uint256 price, uint16 commissionRate, string calldata distributorUsername, address distributor) external onlyOwner returns (uint256 batchId)`

- **功能**：批量铸造母矿机，分配给指定的经销商。

- **参数**：

  - `count`：铸造数量

  - `price`：母矿机单价（USD）

  - `commissionRate`：佣金比例

  - `distributorUsername`：经销商用户名

  - `distributor`：经销商地址

- **返回值**：铸造批次 ID

- **权限**：仅平台所有者（`store.platformWallet()`）

- **限制**：

  - 数量必须大于 0，经销商地址不为 0

  - 佣金比例不超过 100

### 2. 矿机激活与停用&#xA;

#### `deactivateLP(uint256 machineId) external onlyMachineOwner(machineId)`

- **功能**：停用矿机的 LP 质押，结算生产时间并退还 LP。

- **参数**：`machineId` - 矿机 ID

- **权限**：仅矿机所有者

- **限制**：

  - 矿机必须处于激活状态

  - 存在质押的 LP

- **逻辑**：

  - 计算从上次生产到当前的生产分钟数并累计

  - 更新矿机状态为未激活、未生产

  - 退还质押的 LP 给所有者

#### `activateMachineWithLP(uint256 machineId) external onlyMachineOwner(machineId) notOnSale(machineId)`

- **功能**：使用 LP 激活矿机，使其可以开始生产。

- **参数**：`machineId` - 矿机 ID

- **权限**：仅矿机所有者

- **限制**：

  - 矿机未处于激活状态

  - 矿机未处于上架状态

- **逻辑**：

  - 收取相应的 LP 费用

  - 更新矿机状态为激活、记录激活时间和上次生产时间

  - 若为子矿机且已支付燃料，则设置为生产中状态

#### `payFuel(uint256 machineId, uint256 _n) external onlyMachineOwner(machineId) notOnSale(machineId)`

- **功能**：为子矿机支付燃料，延长生产时间。

- **参数**：

  - `machineId`：子矿机 ID

  - `_n`：燃料单位数量（每个单位提供 30 分钟燃料）

- **权限**：仅子矿机所有者

- **限制**：

  - 必须是子矿机

  - 矿机已激活

  - 矿机未处于上架状态

- **逻辑**：

  - 收取燃料费用

  - 增加燃料剩余分钟数（`30 * _n`）

  - 设置矿机为已支付燃料、生产中状态

### 3. 订单管理&#xA;

#### `createInternalMachineOrder(address buyer, uint256[] calldata machineIds) external`

- **功能**：创建内部订单，向指定买家出售矿机（母矿机或子矿机）。

- **参数**：

  - `buyer`：买家地址

  - `machineIds`：矿机 ID 列表

- **权限**：任意用户（需为矿机所有者）

- **限制**：

  - 买家地址有效且与卖家不同

  - 矿机未处于其他订单中

  - 母矿机只能由经销商出售

  - 子矿机未处于上架状态

- **逻辑**：

  - 计算订单总价格（母矿机用批次价格，子矿机用剩余时间比例价格）

  - 创建内部订单并关联矿机

#### `buyMachine(uint256 orderId) external`

- **功能**：购买内部订单中的矿机。

- **参数**：`orderId` - 订单 ID

- **权限**：仅订单指定的买家

- **限制**：

  - 订单处于待成交状态

  - 买家不是经销商

  - 订单包含矿机

- **逻辑**：

  - 计算总价格、平台费用和卖家收入

  - 收取买家费用并分配给平台和卖家

  - 转移矿机所有权给买家

  - 更新订单状态为已成交

#### `cancelInternalMachineOrder(uint256 orderId) external`

- **功能**：取消内部订单。

- **参数**：`orderId` - 订单 ID

- **权限**：仅订单卖家

- **限制**：订单处于待成交状态

- **逻辑**：

  - 更新订单状态为已撤销

  - 解除矿机与订单的关联

### 4. 子矿机上架与交易&#xA;

#### `listChildMachine(uint256 machineId) external onlyMachineOwner(machineId)`

- **功能**：将子矿机上架出售。

- **参数**：`machineId` - 子矿机 ID

- **权限**：仅子矿机所有者

- **限制**：

  - 必须是子矿机

  - 子矿机未激活

  - 子矿机未处于其他订单中

  - 子矿机未处于上架状态

- **逻辑**：

  - 计算子矿机的上架价格（基于剩余生产时间比例）

  - 创建上架订单并关联子矿机

  - 更新活跃订单数量

#### `buyListedChildMachine(uint256 orderId) external`

- **功能**：购买上架的子矿机。

- **参数**：`orderId` - 上架订单 ID

- **权限**：任意用户（非经销商）

- **限制**：

  - 订单处于有效状态

  - 必须是子矿机且未激活

- **逻辑**：

  - 计算卖家收入和平台费用并分配

  - 转移子矿机所有权给买家

  - 更新订单状态为已成交，减少活跃订单数量

#### `cancelListedChildMachine(uint256 orderId) external`

- **功能**：取消子矿机的上架订单。

- **参数**：`orderId` - 上架订单 ID

- **权限**：仅订单卖家

- **限制**：

  - 订单处于有效状态

  - 订单关联的子矿机未激活

- **逻辑**：

  - 更新订单状态为已取消

  - 解除子矿机与订单的关联，减少活跃订单数量

#### `sellToPlatform(uint256 machineId) external onlyMachineOwner(machineId)`

- **功能**：将上架的子矿机卖给平台。

- **参数**：`machineId` - 子矿机 ID

- **权限**：仅子矿机所有者

- **限制**：

  - 子矿机已上架且订单有效

  - 距离上架时间已超过 15 分钟

- **逻辑**：

  - 计算平台收购价格（基于剩余时间比例）

  - 转移子矿机所有权给平台

  - 向卖家支付相应的 IDX

  - 更新订单状态为已售给平台，减少活跃订单数量

### 5. 价格计算&#xA;

#### `getIDXAmount(uint256 usdtAmount) public view returns (uint256)`

- **功能**：根据 USDT 金额计算对应的 IDX 数量。

- **参数**：`usdtAmount` - USDT 金额

- **返回值**：对应的 IDX 数量

- **逻辑**：基于 IDX-USDT 交易对的储备计算兑换比例

### 6. 管理功能&#xA;

#### `setChildMachinePrice(uint256 _price) external onlyOwner`

- **功能**：设置子矿机基础价格（USD）。

- **参数**：`_price` - 新价格

- **权限**：仅平台所有者

- **限制**：价格必须大于 0

#### `setChildMachineTradeConfig(uint256 platformFeeUSD, uint256 sellerIncomeUSD, uint256 _lpUsd) external onlyOwner`

- **功能**：设置子矿机交易相关配置（平台费用、卖家收入、LP 费用）。

- **参数**：

  - `platformFeeUSD`：平台费用（USD）

  - `sellerIncomeUSD`：卖家收入（USD）

  - `_lpUsd`：LP 费用（USD）

- **权限**：仅平台所有者

- **限制**：费用必须大于 0

#### `setCriticalAddress(AddressType typeId, address newAddress) external onlyAdmin`

- **功能**：设置关键合约地址（存储合约或历史记录合约）。

- **参数**：

  - `typeId`：地址类型（0 = 存储合约，1 = 历史记录合约）

  - `newAddress`：新地址

- **权限**：仅超级管理员（`store.sadmin()`）

- **限制**：新地址不为 0

#### `withdrawToken(address token, address to, uint256 amount) external onlyOwner`

- **功能**：提取合约中的指定代币。

- **参数**：

  - `token`：代币地址

  - `to`：接收地址

  - `amount`：提取数量

- **权限**：仅平台所有者

### 7. 订单迁移与查询&#xA;

#### `migrateInternalOrder(uint256 orderId, address seller, address buyer, uint256 price, uint256[] calldata machineIds, uint8 status) external onlyOwner`

- **功能**：迁移内部订单（用于数据迁移）。

- **参数**：订单相关信息

- **权限**：仅平台所有者

#### `migrateListedOrder(uint256 orderId, uint256 machineId, address seller, uint256 price, uint256 status) external onlyOwner`

- **功能**：迁移上架订单（用于数据迁移）。

- **参数**：订单相关信息

- **权限**：仅平台所有者

#### `getInternalOrderMachineIds(uint256 orderId) public view returns (uint256[] memory)`

- **功能**：查询内部订单包含的矿机 ID 列表。

- **参数**：`orderId` - 订单 ID

- **返回值**：矿机 ID 列表

权限说明

- `onlyOwner`：仅平台所有者（`store.platformWallet()`）可调用

- `onlyAdmin`：仅超级管理员（`store.sadmin()`）可调用

- `onlyMachineOwner`：仅矿机所有者可调用

- `notOnSale`：矿机未处于上架状态时可调用

事件说明

| 事件名&#xA;      | 说明&#xA;                                             |
| ---------------- | ----------------------------------------------------- |
| `TokenWithdrawn` | 提取代币时触发，记录代币、接收地址、数量和时间戳&#xA; |
