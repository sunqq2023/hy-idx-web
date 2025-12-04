MiningMachineProductionLogic 合约接口说明

合约概述

`MiningMachineProductionLogic` 是矿机生产系统的核心逻辑合约，负责母矿机产子矿机、子矿机产 MIX 奖励、MIX 兑换 IDX（含锁仓释放）等核心功能。

核心数据结构

| 结构名&#xA;   | 字段&#xA;        | 说明&#xA;                       |
| ------------- | ---------------- | ------------------------------- |
| `ReleaseInfo` | `totalAmount`    | 锁仓的 IDX 总数量&#xA;          |
|               | `startTime`      | 锁仓开始时间（时间戳，秒）&#xA; |
|               | `releasedAmount` | 已释放的 IDX 数量&#xA;          |

常量说明

| 常量名&#xA;                | 值&#xA;         | 说明&#xA;                         |
| -------------------------- | --------------- | --------------------------------- |
| `LOCK_DURATION`            | 90 minutes&#xA; | MIX 兑换 IDX 后的锁仓时长&#xA;    |
| `RELEASE_DURATION`         | 90 minutes&#xA; | 锁仓结束后，IDX 的总释放时长&#xA; |
| `RELEASE_INTERVAL_MINUTES` | 1&#xA;          | 释放间隔（每分钟释放一次）&#xA;   |
| `MOTHER_PRODUCE_INTERVAL`  | 10&#xA;         | 母矿机产子矿机的间隔（分钟）&#xA; |
| `MOTHER_LIFETIME`          | 90&#xA;         | 母矿机总生命周期（分钟）&#xA;     |
| `CHILD_LIFETIME`           | 365&#xA;        | 子矿机总生命周期（分钟）&#xA;     |
| `MIX_PER_MINUTE`           | 4 \* 1e18&#xA;  | 子矿机每分钟产出的 MIX 数量&#xA;  |

主要接口说明

### 1. 母矿机产子矿机&#xA;

#### `claimChildren(uint256 motherId) external onlyMachineOwner(motherId) returns (uint256[] memory childIds)`

- **功能**：母矿机按照 10 分钟 / 个的间隔生产子矿机，生命周期 90 分钟（最多产 9 个）。

- **参数**：`motherId` - 母矿机 ID。

- **返回值**：新生产的子矿机 ID 列表。

- **权限**：仅母矿机所有者。

- **限制**：

  - 母矿机必须处于激活状态且未销毁。

  - 距离上次生产已超过 10 分钟。

  - 未超过 90 分钟生命周期。

### 2. 子矿机产 MIX 奖励&#xA;

#### `claimMix(uint256 machineId) external onlyMachineOwner(machineId)`

- **功能**：子矿机根据燃料剩余时间生产 MIX，直接发放到用户余额（不锁仓）。

- **参数**：`machineId` - 子矿机 ID。

- **权限**：仅子矿机所有者。

- **限制**：

  - 子矿机必须处于激活、已支付燃料、正在生产且未销毁状态。

  - 未超过 365 分钟生命周期。

  - 距离上次生产已超过 1 分钟。

- **奖励计算**：`可用生产分钟数 × 4 × 1e18`（可用时间取燃料剩余、生命周期剩余、实际过去时间的最小值）。

### 3. MIX 兑换 IDX（含锁仓）&#xA;

#### `convertMIXtoIDX(uint256 mixAmount) external`

- **功能**：使用 100 MIX 兑换等价于 50 USD 的 IDX，IDX 进入锁仓（90 分钟后开始释放）。

- **参数**：`mixAmount` - 需兑换的 MIX 数量（固定为 100 × 1e18）。

- **权限**：任意用户（需持有足够 MIX）。

- **锁仓规则**：

  - 前 90 分钟：完全锁仓，不可释放。

  - 第 91 分钟起：每分钟释放 1/90，90 分钟内释放完毕。

- **事件**：`MixConvertedToIdxLocked` - 记录兑换的 MIX 数量、IDX 数量和锁仓记录 ID。

### 4. 领取已释放的 IDX&#xA;

#### `claimReleasedIdx(uint256 releaseId) external`

- **功能**：领取锁仓中已释放的 IDX（适用于 MIX 兑换 IDX 的锁仓场景）。

- **参数**：`releaseId` - 锁仓记录 ID（通过`getUserReleaseIds`获取）。

- **权限**：锁仓记录的所有者。

- **释放规则**：

  - 锁仓期（前 90 分钟）：不可领取。

  - 释放期（91-180 分钟）：按已过分钟数比例领取（每分钟 1/90）。

  - 180 分钟后：可领取全部剩余 IDX。

- **事件**：`IdxReleased` - 记录领取的 IDX 数量和剩余未释放数量。

### 5. MIX 合成子矿机&#xA;

#### `mixToChildMachine() external returns (uint256 newChildId)`

- **功能**：消耗 80 MIX 合成 1 台新子矿机。

- **返回值**：新子矿机的 ID。

- **权限**：任意用户（需持有 80 MIX）。

### 6. 过期子矿机合成新矿机&#xA;

#### `combineSmashedMachines(uint256[] calldata machineIds) external returns (uint256 newChildId)`

- **功能**：使用 100 台过期子矿机（生命周期 ≥365 分钟）合成 1 台新子矿机。

- **参数**：`machineIds` - 100 台过期子矿机的 ID 列表。

- **返回值**：新子矿机的 ID。

- **权限**：子矿机所有者。

- **限制**：

  - 必须提供 100 台子矿机。

  - 所有子矿机已过期（生命周期 ≥365 分钟）且未销毁。

### 7. 锁仓释放信息查询&#xA;

#### `getReleaseInfo(address user, uint256 releaseId) external view returns (...)`

- **功能**：查询指定用户的锁仓记录详情。

- **参数**：

  - `user` - 用户名地址。

  - `releaseId` - 锁仓记录 ID（通过`getUserReleaseIds`获取）。

- **返回值**：

  - `totalAmount`：锁仓 IDX 总数量。

  - `startTime`：锁仓开始时间。

  - `releasedAmount`：已释放数量。

  - `releasableAmount`：当前可领取数量。

  - `remainingAmount`：剩余未释放数量。

  - `remainingLockTime`：剩余锁仓时间（秒，锁仓期内有效）。

  - `remainingReleaseTime`：剩余释放时间（秒，释放期内有效）。

### 8. 用户锁仓记录 ID 列表&#xA;

#### `getUserReleaseIds(address user) external view returns (uint256[] memory)`

- **功能**：查询指定用户的所有锁仓记录 ID，用于遍历查询详情。

- **参数**：`user` - 用户名地址。

- **返回值**：锁仓记录 ID 数组。

### 9. 矿机生产信息查询&#xA;

#### `viewMachineProduction(uint256 machineId) external view returns (...)`

- **功能**：查询矿机的生产状态（产出数量、剩余生命周期等）。

- **参数**：`machineId` - 矿机 ID。

- **返回值**：

  - 母矿机：已产子矿机数、剩余可产数、未领取数等。

  - 子矿机：已产 MIX、已生产分钟数、剩余燃料、未领取 MIX 等。

事件说明

| 事件名&#xA;               | 说明&#xA;                                                           |
| ------------------------- | ------------------------------------------------------------------- |
| `ChildMachinesClaimed`    | 母矿机生产子矿机时触发，记录母矿机 ID 和子矿机 ID 列表。&#xA;       |
| `MixClaimed`              | 子矿机领取 MIX 时触发，记录矿机 ID、所有者和 MIX 数量。&#xA;        |
| `IdxReleased`             | 领取已释放 IDX 时触发，记录用户、释放 ID、领取数量和剩余数量。&#xA; |
| `MixConvertedToIdxLocked` | MIX 兑换 IDX 时触发，记录兑换的 MIX 数量、IDX 数量和锁仓 ID。&#xA;  |
| `MachineDestroyed`        | 矿机生命周期结束时触发，记录矿机 ID、类型和销毁时间。&#xA;          |

权限说明

- `onlySadmin`：仅超级管理员（`store.sadmin()`）可调用。

- `onlyOwner`：仅平台钱包（`store.platformWallet()`）可调用。

- `onlyMachineOwner`：仅矿机所有者可调用（通过`store.machines(machineId)`验证）。
