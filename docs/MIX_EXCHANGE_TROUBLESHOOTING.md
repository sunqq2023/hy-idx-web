# MIX 兑换 IDX 问题排查指南

## 问题描述
兑换 MIX 时出现 "合约错误，无法预估Gas" 的错误。

## 可能的原因

### 1. **合约 IDX 余额不足**（最可能）
**原因：**
- `convertMIXtoIDX` 函数需要将 IDX 转给销毁地址（death address）
- 如果合约本身没有足够的 IDX 余额，转账会失败

**检查方法：**
```solidity
// 查询合约的 IDX 余额
address productionLogic = MiningMachineProductionLogicAddress;
address idxToken = store.idxToken();
uint256 contractBalance = IERC20(idxToken).balanceOf(productionLogic);
```

**解决方案：**
- 管理员需要向 `MiningMachineProductionLogic` 合约转入足够的 IDX
- 或者调整兑换比例，减少每次兑换的 IDX 数量

### 2. **getIDXAmount 返回 0**
**原因：**
- `getIDXAmount` 函数基于交易对（IDX/USDT）的余额计算
- 如果交易对余额为 0 或计算后为 0，会触发 `require(idxAmount > 0, "No IDX to release")`

**检查方法：**
```typescript
// 在前端调用 getIDXAmount 查看返回值
const idxAmount = await readContract(config, {
  address: MiningMachineProductionLogicAddress,
  abi: MiningMachineProductionLogicABI,
  functionName: "getIDXAmount",
  args: [50 * exchangeMixCount], // idxn * _n
});
console.log("可兑换IDX数量:", formatEther(idxAmount));
```

**解决方案：**
- 检查交易对地址是否正确
- 确认交易对中有足够的流动性
- 检查 `idxn` 参数设置（默认 50）

### 3. **MIX 余额不足**
**原因：**
- 虽然前端有检查，但可能余额刚好不够
- 或者余额查询有延迟

**检查方法：**
```typescript
// 查询用户 MIX 余额
const mixBalance = await readContract(config, {
  address: MiningMachineSystemStorageAddress,
  abi: MiningMachineSystemStorageABI,
  functionName: "mixBalances",
  args: [userAddress],
});
console.log("MIX余额:", formatEther(mixBalance));
```

**解决方案：**
- 确保用户有足够的 MIX（至少 100 MIX）
- 刷新余额后再试

### 4. **兑换数量为 0**
**原因：**
- `exchangeMixCount = Math.floor(+mixBalance / 100)` 可能为 0
- 如果 mixBalance < 100，计算结果为 0

**检查方法：**
- 前端已添加检查，会显示 "兑换数量为0"

**解决方案：**
- 确保 MIX 余额 >= 100

### 5. **合约参数未设置**
**原因：**
- `mixn` 或 `idxn` 参数可能未正确设置
- 默认值：`mixn = 100`, `idxn = 50`

**检查方法：**
```typescript
// 查询合约参数
const mixn = await readContract(config, {
  address: MiningMachineProductionLogicAddress,
  abi: MiningMachineProductionLogicABI,
  functionName: "mixn",
});
const idxn = await readContract(config, {
  address: MiningMachineProductionLogicAddress,
  abi: MiningMachineProductionLogicABI,
  functionName: "idxn",
});
console.log("mixn:", mixn.toString(), "idxn:", idxn.toString());
```

**解决方案：**
- 管理员需要调用 `setSwap` 函数设置正确的参数

## 合约函数逻辑

```solidity
function convertMIXtoIDX(uint256 _n) external {
    // 1. 计算需要的 MIX 数量
    uint256 mixAmount = _n * mixn * 1e18; // _n * 100 * 1e18
    require(store.mixBalances(msg.sender) >= mixAmount, "Insufficient MIX");

    // 2. 扣除用户的 MIX
    store.subMixBalance(msg.sender, mixAmount);

    // 3. 计算可兑换的 IDX 数量
    uint256 idxAmount = getIDXAmount(idxn * _n); // getIDXAmount(50 * _n)
    require(idxAmount > 0, "No IDX to release");

    // 4. 创建锁仓记录
    uint256 releaseId = releaseIdCounter++;
    userReleaseInfos[msg.sender][releaseId] = ReleaseInfo({
        totalAmount: idxAmount,
        startTime: block.timestamp,
        releasedAmount: 0
    });
    userReleaseIds[msg.sender].push(releaseId);

    // 5. 将 IDX 转给销毁地址（这里可能失败）
    require(IERC20(store.idxToken()).transfer(death, idxAmount), "IDX transfer failed");

    emit MixConvertedToIdxLocked(msg.sender, mixAmount, idxAmount, releaseId);
}
```

## 诊断步骤

### 步骤 1: 检查用户 MIX 余额
```typescript
const mixBalance = await readContract(config, {
  address: MiningMachineSystemStorageAddress,
  abi: MiningMachineSystemStorageABI,
  functionName: "mixBalances",
  args: [userAddress],
});
console.log("用户MIX余额:", formatEther(mixBalance));
```

### 步骤 2: 检查兑换数量
```typescript
const exchangeMixCount = Math.floor(+formatEther(mixBalance) / 100);
console.log("可兑换数量:", exchangeMixCount);
if (exchangeMixCount === 0) {
  console.error("兑换数量为0，需要至少100 MIX");
}
```

### 步骤 3: 检查可兑换的 IDX 数量
```typescript
const idxn = await readContract(config, {
  address: MiningMachineProductionLogicAddress,
  abi: MiningMachineProductionLogicABI,
  functionName: "idxn",
});
const idxAmount = await readContract(config, {
  address: MiningMachineProductionLogicAddress,
  abi: MiningMachineProductionLogicABI,
  functionName: "getIDXAmount",
  args: [Number(idxn) * exchangeMixCount],
});
console.log("可兑换IDX数量:", formatEther(idxAmount));
if (idxAmount === 0n) {
  console.error("IDX数量为0，可能是交易对余额不足");
}
```

### 步骤 4: 检查合约 IDX 余额
```typescript
const idxToken = await readContract(config, {
  address: MiningMachineSystemStorageAddress,
  abi: MiningMachineSystemStorageABI,
  functionName: "idxToken",
});
const contractBalance = await readContract(config, {
  address: idxToken as `0x${string}`,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [MiningMachineProductionLogicAddress],
});
console.log("合约IDX余额:", formatEther(contractBalance));
console.log("需要IDX数量:", formatEther(idxAmount));
if (contractBalance < idxAmount) {
  console.error("合约IDX余额不足！需要:", formatEther(idxAmount), "可用:", formatEther(contractBalance));
}
```

## 已改进的错误处理

代码已更新，现在会：
1. 检查兑换数量是否为 0
2. 显示详细的错误信息（包括合约 revert 原因）
3. 区分不同类型的错误（余额不足、IDX数量为0、转账失败等）

## 常见错误信息对照

| 错误信息 | 可能原因 | 解决方案 |
|---------|---------|---------|
| "MIX余额不足" | 用户MIX余额 < 100 | 增加MIX余额 |
| "兑换数量为0" | mixBalance < 100 | 增加MIX余额 |
| "无法兑换：IDX数量为0" | getIDXAmount返回0 | 检查交易对流动性 |
| "合约IDX余额不足" | 合约没有足够IDX | 管理员向合约转入IDX |
| "Gas估算失败" | 合约会revert | 检查上述所有条件 |

## 管理员操作

如果需要向合约转入 IDX：

```solidity
// 1. 查询合约地址
address productionLogic = MiningMachineProductionLogicAddress;

// 2. 查询需要的IDX数量
uint256 requiredIDX = getIDXAmount(idxn * expectedExchangeCount);

// 3. 向合约转入IDX
IERC20(idxToken).transfer(productionLogic, requiredIDX);
```

## 联系支持

如果以上步骤都无法解决问题，请提供：
1. 用户地址
2. 用户MIX余额
3. 尝试兑换的数量
4. 完整的错误信息（浏览器控制台）
5. 合约地址和网络信息
