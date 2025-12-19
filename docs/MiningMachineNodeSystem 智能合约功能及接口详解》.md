# MiningMachineNodeSystem 接口文档

## 合约概述

`MiningMachineNodeSystem` 是一个管理矿机销毁记录、节点创建与维护、MIX 奖励分发的合约。主要功能包括：记录矿机销毁、创建节点、领取节点奖励、查询节点及奖励相关数据等。

**依赖合约**：



*   `MiningMachineSystemStorage`：存储核心数据

*   `MiningMachineHistory`：存储燃料及历史数据

*   `MiningMachineSystemLogic`：核心业务逻辑

## 核心数据结构

### 1. Node（节点结构体）



| 字段名          | 类型      | 描述          |
| ------------ | ------- | ----------- |
| owner        | address | 节点所有者地址     |
| creationTime | uint256 | 节点创建时间（时间戳） |
| active       | bool    | 节点是否活跃      |

## 状态变量（查询用）



| 变量名                      | 类型                                           | 描述                              |
| ------------------------ | -------------------------------------------- | ------------------------------- |
| store                    | MiningMachineSystemStorage                   | 关联的存储合约实例                       |
| history                  | MiningMachineHistory                         | 关联的历史数据合约实例                     |
| systemLogic              | MiningMachineSystemLogic                     | 关联的业务逻辑合约实例                     |
| machineDestroyedRecorded | mapping(uint256 => bool)                     | 矿机是否已销毁记录（矿机 ID => 状态）          |
| destroyedMachineCount    | mapping(address => uint256)                  | 用户销毁的矿机数量（用户地址 => 数量）           |
| nodes                    | Node\[]                                      | 所有节点列表                          |
| nodesAmount              | uint256                                      | 创建节点所需销毁的矿机数量（常量，可更新）           |
| userNodes                | mapping(address => uint256\[])               | 用户拥有的节点 ID 列表（用户地址 => 节点 ID 数组） |
| userMixRewardClaimed     | mapping(address => mapping(uint256 => bool)) | 用户奖励领取记录（用户地址 => 日期时间戳 => 领取状态） |

## 权限控制



| 修饰符        | 权限说明                          |
| ---------- | ----------------------------- |
| onlySadmin | 仅合约超级管理员（`store.sadmin()`）可调用 |
| onlyAuth   | 仅授权合约（`history`关联的逻辑合约）可调用    |

## 主要功能接口

### 一、设置类接口（仅管理员）

#### 1. setSystemLogic

**功能**：更新关联的存储合约、历史合约和逻辑合约实例

**参数**：



*   `logicAddress`：新的业务逻辑合约地址

*   `storAddress`：新的存储合约地址

*   `_historyAddress`：新的历史数据合约地址

    **权限**：`onlySadmin`

    **无返回值**

#### 2. setNodesAmount

**功能**：更新创建节点所需销毁的矿机数量

**参数**：



*   `_newAmount`：新的数量（必须大于 0）

    **权限**：`onlySadmin`

    **无返回值**

    **事件**：`NodesAmountUpdated(oldValue, newValue)`（旧值与新值）

### 二、矿机销毁记录接口

#### 1. recordMachineDestroyed

**功能**：记录矿机销毁（仅授权合约调用）

**参数**：



*   `machineId`：被销毁的矿机 ID

*   `owner`：矿机所有者地址

    **权限**：`onlyAuth`

    **限制**：矿机未被记录过销毁

    **事件**：`MachineDestroyedRecorded(user, machineId, newCount)`（用户、矿机 ID、更新后的销毁数量）

### 三、节点管理接口

#### 1. createNode

**功能**：用户销毁指定数量矿机以创建节点

**参数**：无

**限制**：用户销毁的矿机数量 ≥ `nodesAmount`

**逻辑**：



1.  从用户的`destroyedMachineCount`中扣除`nodesAmount`

2.  创建新节点并添加到`nodes`列表

3.  记录用户与节点的关联关系

    **事件**：`NodeCreated(user, nodeId, machinesConsumed)`（用户、节点 ID、消耗的矿机数量）

### 四、奖励领取接口

#### 1. claimMixReward

**功能**：用户领取前一天的 MIX 节点奖励

**参数**：无

**限制**：



*   未领取过前一天的奖励

*   前一天有有效的燃料数据（通过`history`合约获取）

*   用户有活跃节点

    **逻辑**：

1.  计算前一天的时间戳（`yesterdayTimestamp`）

2.  从`history`获取前一天的燃料数据（`totalFuelValue`）

3.  计算总奖励（燃料价值的 5%）

4.  按用户活跃节点数占总活跃节点数的比例分配奖励

5.  发放奖励到用户的 MIX 余额

    **事件**：`MixRewardClaimed(user, mixAmount, dayTimestamp)`（用户、奖励数量、日期时间戳）

### 五、查询接口

#### 1. getTotalActiveNodeCount

**功能**：查询当前总活跃节点数量

**参数**：无

**返回值**：`uint256`（总活跃节点数）

#### 2. getUserActiveNodeCount

**功能**：查询指定用户的活跃节点数量

**参数**：



*   `user`：用户地址

    **返回值**：`uint256`（用户的活跃节点数）

#### 3. getTotalNodeCount

**功能**：查询所有节点的总数量（含非活跃）

**参数**：无

**返回值**：`uint256`（总节点数）

#### 4. getUserNodeCount

**功能**：查询指定用户拥有的节点总数（含非活跃）

**参数**：



*   `user`：用户地址

    **返回值**：`uint256`（用户的节点总数）

#### 5. hasUserClaimedMix

**功能**：查询用户是否已领取指定日期的 MIX 奖励

**参数**：



*   `user`：用户地址

*   `dayTimestamp`：日期时间戳（某一天的 0 点）

    **返回值**：`bool`（是否已领取）

#### 6. getUserCurrentAvailableMix

**功能**：查询用户当前可领取的 MIX 奖励（前一天未领取的奖励）

**参数**：



*   `user`：用户地址

    **返回值**：`uint256`（可领取的奖励数量，0 表示不可领取）

#### 7. getDailyFuelData

**功能**：查询指定日期的燃料数据（委托`history`合约实现）

**参数**：



*   `dayTimestamp`：日期时间戳（某一天的 0 点）

    **返回值**：

*   `timestamp`：日期时间戳

*   `totalCount`：总记录数

*   `totalFuelAmount`：总燃料数量

*   `totalFuelValue`：总燃料价值

## 事件说明



| 事件名                      | 参数列表                                                                                              | 描述                            |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------- |
| MachineDestroyedRecorded | `address user`, `uint256 machineId`, `uint256 newCount`                                           | 记录矿机销毁时触发（用户、矿机 ID、更新后销毁数量）   |
| NodeCreated              | `address user`, `uint256 nodeId`, `uint256 machinesConsumed`                                      | 创建节点时触发（用户、节点 ID、消耗矿机数量）      |
| DailyFuelDataUpdated     | `uint256 dayTimestamp`, `uint256 totalCount`, `uint256 totalFuelAmount`, `uint256 totalFuelValue` | 每日燃料数据更新时触发（日期、总记录数、总燃料量、总价值） |
| MixRewardClaimed         | `address user`, `uint256 mixAmount`, `uint256 dayTimestamp`                                       | 领取 MIX 奖励时触发（用户、奖励数量、日期）      |
| NodesAmountUpdated       | `uint256 oldValue`, `uint256 newValue`                                                            | 更新节点所需矿机数量时触发（旧值、新值）          |

## 辅助函数说明

#### 1. getYesterdayTimestamp

**功能**：计算指定时间戳对应的前一天 0 点时间戳

**参数**：`timestamp`（参考时间戳）

**返回值**：`uint256`（前一天 0 点时间戳）

> （注：文档部分内容可能由 AI 生成）