# 修复 MiningMachineProductionLogic 合约 IDX 余额不足问题

## 问题确认

当前合约 IDX 余额：**1.358 IDX**（`1358405690085135620 wei`）

这个余额很可能不足以支持兑换操作。

## 计算一次兑换需要的 IDX

根据合约逻辑：
- `mixn = 100`（每次兑换需要 100 MIX）
- `idxn = 50`（每次兑换对应 50 USDT 价值的 IDX）
- 实际 IDX 数量通过 `getIDXAmount(50)` 计算，基于交易对余额

### 查询一次兑换需要的 IDX 数量

```bash
# 主网 - 查询一次兑换（n=1）可得到的 IDX 数量
cast call 0x90531429c182707190de682Ed345e3577D44C3d6 \
  "getIDXAmount(uint256)(uint256)" \
  50 \
  --rpc-url https://bsc-dataseed1.binance.org | \
  cast --to-unit wei
```

这个命令会返回一次兑换（100 MIX）可得到的 IDX 数量，也就是合约需要转给销毁地址的 IDX 数量。

## 解决方案：向合约转入 IDX

### 方法 1: 使用 cast send（推荐）

```bash
# 转入 10000 IDX 到合约（主网）
# 注意：需要设置 PRIVATE_KEY 环境变量或使用 --private-key 参数
cast send 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
  "transfer(address,uint256)" \
  0x90531429c182707190de682Ed345e3577D44C3d6 \
  $(cast --to-wei 10000) \
  --rpc-url https://bsc-dataseed1.binance.org \
  --private-key $PRIVATE_KEY
```

### 方法 2: 使用 MetaMask 或其他钱包

1. 打开 MetaMask，切换到 BSC 主网
2. 确保账户有足够的 IDX 代币
3. 发送 IDX 代币：
   - **接收地址**: `0x90531429c182707190de682Ed345e3577D44C3d6`
   - **数量**: 建议至少 10000 IDX（根据实际需求调整）

### 方法 3: 使用 Foundry 脚本

创建脚本 `script/TransferIDXToProductionLogic.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TransferIDXToProductionLogic is Script {
    address constant IDX_TOKEN = 0xc98F60B3F98E8Bf860436746db637e13B0e17458;
    address constant PRODUCTION_LOGIC = 0x90531429c182707190de682Ed345e3577D44C3d6;
    uint256 constant AMOUNT = 10000 * 1e18; // 10000 IDX

    function run() external {
        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPk);

        IERC20 idxToken = IERC20(IDX_TOKEN);
        require(idxToken.transfer(PRODUCTION_LOGIC, AMOUNT), "Transfer failed");

        vm.stopBroadcast();
    }
}
```

运行脚本：
```bash
forge script script/TransferIDXToProductionLogic.s.sol:TransferIDXToProductionLogic \
  --rpc-url https://bsc-dataseed1.binance.org \
  --broadcast \
  --verify
```

## 计算需要转入的 IDX 数量

### 1. 先查询一次兑换需要的 IDX

```bash
# 查询一次兑换（100 MIX）需要的 IDX 数量
IDX_PER_EXCHANGE=$(cast call 0x90531429c182707190de682Ed345e3577D44C3d6 \
  "getIDXAmount(uint256)(uint256)" \
  50 \
  --rpc-url https://bsc-dataseed1.binance.org)

echo "一次兑换需要: $(cast --to-unit $IDX_PER_EXCHANGE wei) IDX"
```

### 2. 根据预期兑换次数计算

假设预期支持 100 次兑换：
```bash
# 需要的总 IDX = 一次兑换需要的 IDX * 100
# 建议多转入 20% 作为缓冲
REQUIRED_IDX=$(echo "$IDX_PER_EXCHANGE * 120 / 100" | bc)
echo "建议转入: $(cast --to-unit $REQUIRED_IDX wei) IDX"
```

## 验证转入是否成功

```bash
# 查询转入后的余额
cast call 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
  "balanceOf(address)(uint256)" \
  0x90531429c182707190de682Ed345e3577D44C3d6 \
  --rpc-url https://bsc-dataseed1.binance.org | \
  cast --to-unit wei
```

## 注意事项

1. **确保发送账户有足够的 IDX**：在转入前检查发送账户的 IDX 余额
2. **确保有足够的 BNB**：转账需要支付 Gas 费（BNB）
3. **建议多转入一些**：预留缓冲，避免频繁转入
4. **监控余额**：定期检查合约余额，及时补充

## 检查发送账户余额

```bash
# 查询发送账户的 IDX 余额（替换 YOUR_ADDRESS）
cast call 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
  "balanceOf(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url https://bsc-dataseed1.binance.org | \
  cast --to-unit wei

# 查询发送账户的 BNB 余额
cast balance YOUR_ADDRESS --rpc-url https://bsc-dataseed1.binance.org | \
  cast --to-unit wei
```

## 完整操作流程

1. **查询当前余额**（已完成）
   ```bash
   cast call 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
     "balanceOf(address)(uint256)" \
     0x90531429c182707190de682Ed345e3577D44C3d6 \
     --rpc-url https://bsc-dataseed1.binance.org | \
     cast --to-unit wei
   ```

2. **查询一次兑换需要的 IDX**
   ```bash
   cast call 0x90531429c182707190de682Ed345e3577D44C3d6 \
     "getIDXAmount(uint256)(uint256)" \
     50 \
     --rpc-url https://bsc-dataseed1.binance.org | \
     cast --to-unit wei
   ```

3. **计算需要转入的数量**（建议至少支持 100 次兑换）

4. **转入 IDX 到合约**
   ```bash
   cast send 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
     "transfer(address,uint256)" \
     0x90531429c182707190de682Ed345e3577D44C3d6 \
     $(cast --to-wei 10000) \
     --rpc-url https://bsc-dataseed1.binance.org \
     --private-key $PRIVATE_KEY
   ```

5. **验证转入成功**
   ```bash
   cast call 0xc98F60B3F98E8Bf860436746db637e13B0e17458 \
     "balanceOf(address)(uint256)" \
     0x90531429c182707190de682Ed345e3577D44C3d6 \
     --rpc-url https://bsc-dataseed1.binance.org | \
     cast --to-unit wei
   ```

## 测试网操作

如果是测试网，使用以下地址：

```bash
# 测试网 - 查询余额
cast call 0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD \
  "balanceOf(address)(uint256)" \
  0x288F6339FA31bda1A02fA07ef572f241B2f8f579 \
  --rpc-url https://bsc-testnet.publicnode.com | \
  cast --to-unit wei

# 测试网 - 转入 IDX
cast send 0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD \
  "transfer(address,uint256)" \
  0x288F6339FA31bda1A02fA07ef572f241B2f8f579 \
  $(cast --to-wei 10000) \
  --rpc-url https://bsc-testnet.publicnode.com \
  --private-key $PRIVATE_KEY
```
