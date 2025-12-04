《MiningMachineHistory 合约接口说明》

合约概述

`MiningMachineHistory` 是矿机系统的历史记录合约，负责存储和管理矿机相关的各类记录，包括资产统计、铸造记录、转让记录、收益记录、订单记录等，支持双逻辑合约（生产逻辑合约和系统逻辑合约）授权调用。

核心数据结构

| 结构名&#xA;          | 字段&#xA;           | 说明&#xA;                                           |
| -------------------- | ------------------- | --------------------------------------------------- |
| `AddressStats`       | `motherHold`        | 当前持有母矿机数量&#xA;                             |
|                      | `childHold`         | 当前持有子矿机数量&#xA;                             |
|                      | `motherTransferred` | 累计转让母矿机数量&#xA;                             |
|                      | `childTransferred`  | 累计转让子矿机数量&#xA;                             |
| `BatchDetails`       | `batchId`           | 批次 ID&#xA;                                        |
|                      | `creator`           | 铸造者地址&#xA;                                     |
|                      | `sender`            | 接受者地址&#xA;                                     |
|                      | `createTime`        | 创建时间（时间戳）&#xA;                             |
|                      | `machineCount`      | 该批次矿机数量&#xA;                                 |
|                      | `machineType`       | 矿机类型（1 = 母机，2 = 子机）&#xA;                 |
| `TransferRecord`     | `timestamp`         | 交易时间戳&#xA;                                     |
|                      | `machineId`         | 矿机 ID&#xA;                                        |
|                      | `machineType`       | 矿机类型（1 = 母机，2 = 子机）&#xA;                 |
|                      | `from`              | 转出地址&#xA;                                       |
|                      | `to`                | 转入地址&#xA;                                       |
| `MintBatchRecord`    | `batchId`           | 铸造批次 ID&#xA;                                    |
|                      | `timestamp`         | 铸造时间&#xA;                                       |
|                      | `machineCount`      | 该批次铸造的矿机数量&#xA;                           |
| `EarningRecord`      | `timestamp`         | 记录时间戳&#xA;                                     |
|                      | `relatedMachineId`  | 关联矿机 ID&#xA;                                    |
|                      | `earningType`       | 收益类型（1=MIX，2 = 子矿机）&#xA;                  |
|                      | `amount`            | 收益数量&#xA;                                       |
| `MachineTradeRecord` | `timestamp`         | 交易时间戳&#xA;                                     |
|                      | `machineId`         | 矿机 ID&#xA;                                        |
|                      | `machineType`       | 矿机类型（1 = 母机，2 = 子机）&#xA;                 |
|                      | `seller`            | 卖家地址&#xA;                                       |
|                      | `buyer`             | 买家地址&#xA;                                       |
|                      | `price`             | 交易价格（IDX 数量）&#xA;                           |
|                      | `orderId`           | 关联订单 ID&#xA;                                    |
| `OrderInfo`          | `orderId`           | 订单 ID&#xA;                                        |
|                      | `seller`            | 卖家地址&#xA;                                       |
|                      | `buyer`             | 买家地址&#xA;                                       |
|                      | `createTime`        | 订单创建时间&#xA;                                   |
|                      | `status`            | 订单状态（0 = 待成交，1 = 已成交，2 = 已取消）&#xA; |
|                      | `orderType`         | 订单类型（1 = 内部订单，2 = 子机挂单）&#xA;         |

主要接口说明

### 1. 订单记录操作&#xA;

#### `recordNewOrder(address seller, address buyer, uint8 orderType) external onlyAuth returns (uint256)`

- **功能**：记录新订单，生成唯一订单 ID。

- **参数**：

  - `seller`：卖家地址

  - `buyer`：买家地址

  - `orderType`：订单类型（1 = 内部订单，2 = 子机挂单）

- **返回值**：生成的订单 ID。

- **权限**：仅授权的生产逻辑合约或系统逻辑合约。

- **限制**：

  - 订单类型必须为 1 或 2。

  - 卖家地址不为 0，买家地址不为 0（子机挂单除外）。

- **事件**：`OrderCreated` - 记录订单 ID、买家、卖家和订单类型。

#### `updateOrderStatus(uint256 orderId, uint8 newStatus) external onlyAuth`

- **功能**：更新订单状态。

- **参数**：

  - `orderId`：订单 ID

  - `newStatus`：新状态（0 = 待成交，1 = 已成交，2 = 已取消）

- **权限**：仅授权的生产逻辑合约或系统逻辑合约。

- **限制**：

  - 订单必须存在。

  - 新状态必须为 0、1 或 2。

#### `getBuyerOrderIds(address buyer, uint256 start, uint256 limit) external view returns (uint256[] memory)`

- **功能**：分页查询买家的所有订单 ID。

- **参数**：

  - `buyer`：买家地址

  - `start`：起始索引（从 0 开始）

  - `limit`：每页数量

- **返回值**：订单 ID 列表。

#### `getOrderDetails(uint256 orderId) external view returns (uint256 _orderId, address seller, address buyer, uint256 createTime, uint8 status, uint8 orderType)`

- **功能**：查询订单详情。

- **参数**：`orderId` - 订单 ID。

- **返回值**：订单的各项详细信息。

- **限制**：订单必须存在。

### 2. 矿机铸造记录&#xA;

#### `recordMachineMints(address user, address sUser, uint256 machineCount, uint8 machineType, uint256 batchId) external onlyAuth`

- **功能**：记录矿机铸造批次信息。

- **参数**：

  - `user`：铸造者地址

  - `sUser`：接受者地址

  - `machineCount`：该批次矿机数量

  - `machineType`：矿机类型（1 = 母机，2 = 子机）

  - `batchId`：批次 ID

- **权限**：仅授权的生产逻辑合约或系统逻辑合约。

- **限制**：

  - 矿机类型必须为 1 或 2。

  - 矿机数量大于 0。

  - 批次 ID 有效且未被使用。

#### `recordMachineMint(address user, uint256 machineId, uint8 machineType) external onlyAuth`

- **功能**：记录单台矿机的铸造信息。

- **参数**：

  - `user`：接受者地址

  - `machineId`：矿机 ID

  - `machineType`：矿机类型（1 = 母机，2 = 子机）

- **权限**：仅授权的生产逻辑合约或系统逻辑合约。

- **限制**：矿机类型必须为 1 或 2。

### 3. 转让记录&#xA;

#### `recordTransfer(address from, address to, uint256 machineId, uint8 machineType) external onlyAuth`

- **功能**：记录矿机转让信息。

- **参数**：

  - `from`：转出地址

  - `to`：转入地址

  - `machineId`：矿机 ID

  - `machineType`：矿机类型（1 = 母机，2 = 子机）

- **权限**：仅授权的生产逻辑合约或系统逻辑合约。

- **限制**：

  - 矿机类型必须为 1 或 2。

  - 转出地址和转入地址不能相同且不为 0。

### 4. 收益记录&#xA;

#### `recordEarning(address user, uint256 machineId, uint8 earningType, uint256 amount) external onlyAuth`

- **功能**：记录收益领取信息。

- **参数**：

  - `user`：收益领取者地址

  - `machineId`：关联矿机 ID

  - `earningType`：收益类型（1=MIX，2 = 子矿机）

  - `amount`：收益数量

- **权限**：仅授权的生产逻辑合约或系统逻辑合约。

- **限制**：

  - 收益类型必须为 1 或 2。

  - 收益数量大于 0。

  - 用户地址不为 0。

### 5. 统计信息查询&#xA;

#### `getAddressStats(address user) external view returns (uint256 motherHold, uint256 childHold, uint256 motherTransferred, uint256 childTransferred)`

- **功能**：查询地址的矿机持有和转让统计信息。

- **参数**：`user` - 地址。

- **返回值**：该地址持有母矿机、子矿机数量及累计转让的母矿机、子矿机数量。

#### `getTransferRecords(address user, uint256 start, uint256 limit) external view returns (TransferRecord[] memory records)`

- **功能**：分页查询地址的矿机转让记录。

- **参数**：

  - `user`：地址

  - `start`：起始索引

  - `limit`：每页数量

- **返回值**：转让记录列表。

#### `getEarningRecords(address user, uint256 start, uint256 limit) external view returns (EarningRecord[] memory records)`

- **功能**：分页查询地址的收益记录。

- **参数**：

  - `user`：地址

  - `start`：起始索引

  - `limit`：每页数量

- **返回值**：收益记录列表。

### 6. 管理员操作&#xA;

#### `addOrder(uint256 orderId, address seller, address buyer, uint8 orderType, uint8 status) external onlysAdmin`

- **功能**：手动添加订单记录（用于补录历史订单）。

- **参数**：

  - `orderId`：订单 ID

  - `seller`：卖家地址

  - `buyer`：买家地址

  - `orderType`：订单类型（1 = 内部订单，2 = 子机挂单）

  - `status`：订单状态（0 = 待成交，1 = 已成交，2 = 已取消）

- **权限**：仅超级管理员。

#### `updateOrderStatusManual(uint256 orderId, uint8 newStatus) external onlysAdmin`

- **功能**：手动修改订单状态（用于修正错误状态）。

- **参数**：

  - `orderId`：订单 ID

  - `newStatus`：新状态（0 = 待成交，1 = 已成交，2 = 已取消）

- **权限**：仅超级管理员。

- **限制**：订单必须存在，新状态必须为 0、1 或 2。

#### `setAddressHoldings(address user, uint256 motherCount, uint256 childCount) external onlysAdmin`

- **功能**：手动修改地址的矿机持有数量（用于修正统计错误）。

- **参数**：

  - `user`：地址

  - `motherCount`：母矿机数量

  - `childCount`：子矿机数量

- **权限**：仅超级管理员。

#### `resetNextOrderId(uint256 newId) external onlysAdmin`

- **功能**：重置订单 ID 计数器（避免新订单 ID 冲突）。

- **参数**：`newId` - 新的起始 ID。

- **权限**：仅超级管理员。

- **限制**：新 ID 必须大于 0。

权限说明

- `onlyAuth`：仅授权的生产逻辑合约（`productionLogic`）或系统逻辑合约（`systemLogic`）可调用。

- `onlysAdmin`：仅超级管理员（`sadmin`）可调用。

事件说明

| 事件名&#xA;    | 说明&#xA;                                                      |
| -------------- | -------------------------------------------------------------- |
| `BatchIdAdded` | 矿机铸造批次记录添加时触发，记录地址和批次 ID。&#xA;           |
| `OrderCreated` | 新订单记录创建时触发，记录订单 ID、买家、卖家和订单类型。&#xA; |
