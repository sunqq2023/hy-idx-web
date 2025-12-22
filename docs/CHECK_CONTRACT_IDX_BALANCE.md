# 检查 MiningMachineProductionLogic 合约 IDX 余额

## 合约地址

### BSC 主网
- **ProductionLogic 合约**: `0x90531429c182707190de682Ed345e3577D44C3d6`
- **IDX Token**: `0xc98F60B3F98E8Bf860436746db637e13B0e17458`
- **RPC**: `https://bsc-dataseed1.binance.org`

### BSC 测试网
- **ProductionLogic 合约**: `0x288F6339FA31bda1A02fA07ef572f241B2f8f579`
- **IDX Token**: `0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD`
- **RPC**: `https://bsc-testnet.publicnode.com`

## Cast 命令

### 1. 查询主网合约 IDX 余额

```bash
# 查询 ProductionLogic 合约的 IDX 余额
cast call 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
  "balanceOf(address)(uint256)" \
  0x90531429c182707190de682Ed345e3577D44C3d6 \
  --rpc-url https://bsc-dataseed1.binance.org
```

### 2. 查询测试网合约 IDX 余额

```bash
# 查询 ProductionLogic 合约的 IDX 余额
cast call 0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD \
  "balanceOf(address)(uint256)" \
  0x288F6339FA31bda1A02fA07ef572f241B2f8f579 \
  --rpc-url https://bsc-testnet.publicnode.com
```

### 3. 格式化输出（转换为可读格式）

由于 IDX 使用 18 位小数，需要将结果除以 10^18：

```bash
# 主网 - 查询并格式化
cast call 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
  "balanceOf(address)(uint256)" \
  0x90531429c182707190de682Ed345e3577D44C3d6 \
  --rpc-url https://bsc-dataseed1.binance.org | \
  cast --to-unit wei

# 测试网 - 查询并格式化
cast call 0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD \
  "balanceOf(address)(uint256)" \
  0x288F6339FA31bda1A02fA07ef572f241B2f8f579 \
  --rpc-url https://bsc-testnet.publicnode.com | \
  cast --to-unit wei
```

### 4. 查询合约参数（mixn 和 idxn）

```bash
# 主网 - 查询 mixn（每次兑换需要的 MIX 数量，单位：100）
cast call 0x90531429c182707190de682Ed345e3577D44C3d6 \
  "mixn()(uint256)" \
  --rpc-url https://bsc-dataseed1.binance.org

# 主网 - 查询 idxn（每次兑换对应的 USDT 数量，单位：50）
cast call 0x90531429c182707190de682Ed345e3577D44C3d6 \
  "idxn()(uint256)" \
  --rpc-url https://bsc-dataseed1.binance.org

# 测试网 - 查询 mixn
cast call 0x288F6339FA31bda1A02fA07ef572f241B2f8f579 \
  "mixn()(uint256)" \
  --rpc-url https://bsc-testnet.publicnode.com

# 测试网 - 查询 idxn
cast call 0x288F6339FA31bda1A02fA07ef572f241B2f8f579 \
  "idxn()(uint256)" \
  --rpc-url https://bsc-testnet.publicnode.com
```

### 5. 查询销毁地址（death address）

```bash
# 主网
cast call 0x90531429c182707190de682Ed345e3577D44C3d6 \
  "death()(address)" \
  --rpc-url https://bsc-dataseed1.binance.org

# 测试网
cast call 0x288F6339FA31bda1A02fA07ef572f241B2f8f579 \
  "death()(address)" \
  --rpc-url https://bsc-testnet.publicnode.com
```

### 6. 估算一次兑换需要的 IDX 数量

假设用户要兑换 `n` 个单位的 MIX（每个单位需要 100 MIX）：

```bash
# 先查询 idxn
IDXN=$(cast call 0x90531429c182707190de682Ed345e3577D44C3d6 \
  "idxn()(uint256)" \
  --rpc-url https://bsc-dataseed1.binance.org)

# 假设 n=1（兑换 100 MIX）
# 需要查询 getIDXAmount(idxn * n)
# 需要先查询交易对地址
PAIR=$(cast call 0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2 \
  "idxUsdtPair()(address)" \
  --rpc-url https://bsc-dataseed1.binance.org)

# 查询交易对余额来计算 IDX 数量
# 这需要调用 getIDXAmount，但需要知道交易对地址
```

## 完整检查脚本

创建一个脚本文件 `check_contract_balance.sh`：

```bash
#!/bin/bash

# 配置
RPC_URL="https://bsc-dataseed1.binance.org"  # 主网
# RPC_URL="https://bsc-testnet.publicnode.com"  # 测试网

PRODUCTION_LOGIC="0x90531429c182707190de682Ed345e3577D44C3d6"  # 主网
IDX_TOKEN="0xc98F60B3F98E8Bf860436746db637e13B0e17458"  # 主网

# 测试网地址
# PRODUCTION_LOGIC="0x288F6339FA31bda1A02fA07ef572f241B2f8f579"
# IDX_TOKEN="0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD"

echo "=== 检查 MiningMachineProductionLogic 合约状态 ==="
echo ""

# 1. 查询合约 IDX 余额
echo "1. 查询合约 IDX 余额..."
BALANCE=$(cast call $IDX_TOKEN \
  "balanceOf(address)(uint256)" \
  $PRODUCTION_LOGIC \
  --rpc-url $RPC_URL)

BALANCE_READABLE=$(cast --to-unit $BALANCE wei)
echo "   合约 IDX 余额: $BALANCE_READABLE IDX"
echo "   原始值: $BALANCE wei"
echo ""

# 2. 查询 mixn 参数
echo "2. 查询 mixn 参数（每次兑换需要的 MIX 数量）..."
MIXN=$(cast call $PRODUCTION_LOGIC \
  "mixn()(uint256)" \
  --rpc-url $RPC_URL)
echo "   mixn: $MIXN (即每次兑换需要 $MIXN * 1e18 MIX)"
echo ""

# 3. 查询 idxn 参数
echo "3. 查询 idxn 参数（每次兑换对应的 USDT 数量）..."
IDXN=$(cast call $PRODUCTION_LOGIC \
  "idxn()(uint256)" \
  --rpc-url $RPC_URL)
echo "   idxn: $IDXN (即每次兑换对应 $IDXN USDT 价值的 IDX)"
echo ""

# 4. 查询销毁地址
echo "4. 查询销毁地址（death address）..."
DEATH=$(cast call $PRODUCTION_LOGIC \
  "death()(address)" \
  --rpc-url $RPC_URL)
echo "   death address: $DEATH"
echo ""

# 5. 估算一次兑换需要的 IDX（假设 n=1）
echo "5. 估算一次兑换（n=1，即 100 MIX）需要的 IDX 数量..."
# 需要调用 getIDXAmount，但需要知道存储合约地址
STORAGE="0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2"  # 主网
IDX_AMOUNT=$(cast call $PRODUCTION_LOGIC \
  "getIDXAmount(uint256)(uint256)" \
  $IDXN \
  --rpc-url $RPC_URL)

if [ "$IDX_AMOUNT" != "0" ]; then
  IDX_AMOUNT_READABLE=$(cast --to-unit $IDX_AMOUNT wei)
  echo "   一次兑换（100 MIX）可得到: $IDX_AMOUNT_READABLE IDX"
  echo "   原始值: $IDX_AMOUNT wei"

  # 检查余额是否足够
  if [ $(cast --to-bigint $BALANCE) -ge $(cast --to-bigint $IDX_AMOUNT) ]; then
    echo "   ✅ 合约余额充足，可以进行兑换"
  else
    echo "   ❌ 合约余额不足！需要至少 $IDX_AMOUNT_READABLE IDX"
    echo "   当前余额: $BALANCE_READABLE IDX"
    echo "   缺少: $(cast --to-unit $(($(cast --to-bigint $IDX_AMOUNT) - $(cast --to-bigint $BALANCE))) wei) IDX"
  fi
else
  echo "   ⚠️  getIDXAmount 返回 0，可能是交易对余额不足"
fi
echo ""

echo "=== 检查完成 ==="
```

## 快速检查命令（主网）

```bash
# 一键查询主网合约 IDX 余额（格式化输出）
cast call 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
  "balanceOf(address)(uint256)" \
  0x90531429c182707190de682Ed345e3577D44C3d6 \
  --rpc-url https://bsc-dataseed1.binance.org | \
  cast --to-unit wei
```

## 快速检查命令（测试网）

```bash
# 一键查询测试网合约 IDX 余额（格式化输出）
cast call 0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD \
  "balanceOf(address)(uint256)" \
  0x288F6339FA31bda1A02fA07ef572f241B2f8f579 \
  --rpc-url https://bsc-testnet.publicnode.com | \
  cast --to-unit wei
```

## 如果余额不足，需要转入 IDX

如果合约余额不足，管理员需要向合约转入 IDX：

```bash
# 使用 cast send 转入 IDX（需要私钥）
# 注意：这需要管理员权限和足够的 IDX 余额

# 转入 1000 IDX 到合约（主网）
cast send 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
  "transfer(address,uint256)" \
  0x90531429c182707190de682Ed345e3577D44C3d6 \
  $(cast --to-wei 1000) \
  --rpc-url https://bsc-dataseed1.binance.org \
  --private-key $PRIVATE_KEY
```

## 注意事项

1. **确保使用正确的网络**：主网和测试网的地址不同
2. **IDX 使用 18 位小数**：查询结果需要除以 10^18 才是实际数量
3. **合约需要足够的 IDX**：每次兑换都会将 IDX 转给销毁地址，所以合约必须预先有足够的 IDX
4. **检查交易对流动性**：`getIDXAmount` 依赖交易对余额，如果交易对没有流动性，也会导致兑换失败
