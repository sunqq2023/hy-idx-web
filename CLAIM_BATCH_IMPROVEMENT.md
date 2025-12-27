# 领取功能分批优化方案

## 当前状态

### 1. 领取 MIX 积分（ClaimMix.tsx）

- ❌ 一次性领取所有矿机的 MIX
- ❌ 没有分批功能
- ❌ 矿机数量多时容易 Gas 不足

### 2. 领取子矿机（Machine.tsx）

- ✅ 可以手动选择母矿机
- ✅ 支持全选/取消全选
- ⚠️ 用户体验可以优化（没有明确的分批提示）

## 改进方案

### 方案 A：自动分批（推荐）

**优点**：

- 用户无需操作，系统自动处理
- 避免 Gas 不足问题
- 提供进度反馈

**实现**：

```typescript
// 自动分批领取，每批最多 10 个矿机
const BATCH_SIZE = 10;

const handleClaimMixWithBatch = async () => {
  const machineIds = producedMixList.map((item) => item.id);

  if (machineIds.length <= BATCH_SIZE) {
    // 数量少，直接领取
    await claimMix(machineIds);
  } else {
    // 数量多，分批领取
    const batches = [];
    for (let i = 0; i < machineIds.length; i += BATCH_SIZE) {
      batches.push(machineIds.slice(i, i + BATCH_SIZE));
    }

    // 显示进度
    Toast.show({
      content: `需要分 ${batches.length} 批领取，请耐心等待`,
      duration: 3000,
    });

    for (let i = 0; i < batches.length; i++) {
      Toast.show({
        content: `正在领取第 ${i + 1}/${batches.length} 批...`,
        duration: 2000,
      });
      await claimMix(batches[i]);
    }

    Toast.show({
      content: `全部领取完成！`,
      duration: 3000,
    });
  }
};
```

### 方案 B：手动选择分批

**优点**：

- 用户可以自主控制
- 灵活性高

**实现**：

```typescript
// 添加选择功能
const [selectedMachines, setSelectedMachines] = useState<number[]>([]);

// 快速选择按钮
<div className="flex gap-2">
  <Button onClick={() => selectFirst(10)}>选择前10个</Button>
  <Button onClick={() => selectAll()}>全选</Button>
  <Button onClick={() => clearSelection()}>清空</Button>
</div>

// 显示选中数量
<div>已选择 {selectedMachines.length} 个矿机</div>
```

### 方案 C：混合方案（最佳）

**结合自动分批和手动选择**：

1. **默认行为**：
   - 矿机数量 ≤ 10：直接领取
   - 矿机数量 > 10：提示用户选择

2. **用户选择**：
   - 选项 1：自动分批领取全部
   - 选项 2：手动选择要领取的矿机
   - 选项 3：取消

3. **UI 示例**：

```typescript
if (machineIds.length > 10) {
  Modal.show({
    content: (
      <div>
        <p>您有 {machineIds.length} 个矿机待领取</p>
        <p>建议分批领取以避免 Gas 不足</p>
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleAutoBatch}>
            自动分批领取（推荐）
          </Button>
          <Button onClick={handleManualSelect}>
            手动选择矿机
          </Button>
          <Button onClick={handleCancel}>
            取消
          </Button>
        </div>
      </div>
    ),
  });
}
```

## 具体实现建议

### 1. ClaimMix.tsx 改进

```typescript
// 添加常量
const MAX_BATCH_SIZE = 10; // 每批最多 10 个矿机
const GAS_PER_MACHINE = 50000n; // 每个矿机约需 50k gas
const BASE_GAS = 150000n; // 基础 gas

// 修改 handleClaimMix 函数
const handleClaimMix = async () => {
  try {
    setIsClaimingMIX(true);

    const machineIds = producedMixList.map((item) => item.id);

    if (machineIds.length === 0) {
      Toast.show({ content: "没有可领取的 MIX", position: "center" });
      return;
    }

    // 检查是否需要分批
    if (machineIds.length > MAX_BATCH_SIZE) {
      // 显示分批提示
      const batchCount = Math.ceil(machineIds.length / MAX_BATCH_SIZE);

      const confirmed = await new Promise((resolve) => {
        Modal.show({
          content: (
            <div className="text-center">
              <p className="mb-4">
                您有 <span className="font-bold">{machineIds.length}</span> 个矿机待领取
              </p>
              <p className="mb-4 text-sm text-gray-600">
                为避免 Gas 不足，将分 <span className="font-bold">{batchCount}</span> 批领取
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    Modal.clear();
                    resolve(true);
                  }}
                >
                  确认领取
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    Modal.clear();
                    resolve(false);
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          ),
        });
      });

      if (!confirmed) {
        setIsClaimingMIX(false);
        return;
      }

      // 分批领取
      let totalClaimed = 0;
      for (let i = 0; i < machineIds.length; i += MAX_BATCH_SIZE) {
        const batch = machineIds.slice(i, i + MAX_BATCH_SIZE);
        const batchNum = Math.floor(i / MAX_BATCH_SIZE) + 1;

        Toast.show({
          content: `正在领取第 ${batchNum}/${batchCount} 批...`,
          position: "center",
          duration: 2000,
        });

        const contractCall = {
          address: MiningMachineProductionLogicAddress,
          abi: MiningMachineProductionLogicABI,
          functionName: "claimMixByMachineIds",
          args: [batch],
          gas: BASE_GAS + BigInt(batch.length) * GAS_PER_MACHINE,
        };

        const [result] = await executeSequentialCalls([contractCall]);

        if (result?.success && result.data != null) {
          const claimed = Number(formatEther(BigInt(result.data.toString())));
          totalClaimed += claimed;
        }
      }

      // 显示成功提示
      Modal.show({
        content: (
          <div className="text-center">
            <p className="text-green-600 font-bold mb-2">领取成功！</p>
            <p>
              共领取 <span className="font-bold">{totalClaimed.toFixed(2)}</span> MIX
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                Modal.clear();
                navigate("/user");
              }}
            >
              确认
            </Button>
          </div>
        ),
      });

    } else {
      // 数量少，直接领取（原有逻辑）
      const contractCall = {
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: "claimMixByMachineIds",
        args: [machineIds],
        gas: BASE_GAS + BigInt(machineIds.length) * GAS_PER_MACHINE,
      };

      const [result] = await executeSequentialCalls([contractCall]);

      // ... 原有的成功处理逻辑
    }

  } catch (error) {
    console.error("领取MIX失败:", error);
    Toast.show({
      content: "领取失败，请重试",
      position: "center",
    });
  } finally {
    setIsClaimingMIX(false);
  }
};
```

### 2. Machine.tsx 改进

Machine.tsx 已经支持手动选择，但可以添加以下优化：

```typescript
// 添加快速选择按钮
<div className="flex gap-2 mb-2">
  <Button
    size="small"
    onClick={() => {
      // 选择前 5 个
      const first5 = mmIds.slice(0, 5);
      setSelectedMMIds(first5);
    }}
  >
    选择前5个
  </Button>

  <Button
    size="small"
    onClick={() => {
      // 选择前 10 个
      const first10 = mmIds.slice(0, 10);
      setSelectedMMIds(first10);
    }}
  >
    选择前10个
  </Button>
</div>

// 在领取前添加提示
const handleClaimChildren = async () => {
  if (selectedMMIds.length > 10) {
    const confirmed = await new Promise((resolve) => {
      Modal.show({
        content: (
          <div className="text-center">
            <p className="mb-4">
              您选择了 <span className="font-bold">{selectedMMIds.length}</span> 个母矿机
            </p>
            <p className="mb-4 text-sm text-yellow-600">
              ⚠️ 建议每次领取不超过 10 个，以避免 Gas 不足
            </p>
            <div className="flex gap-2">
              <Button onClick={() => { Modal.clear(); resolve(true); }}>
                继续领取
              </Button>
              <Button onClick={() => { Modal.clear(); resolve(false); }}>
                重新选择
              </Button>
            </div>
          </div>
        ),
      });
    });

    if (!confirmed) return;
  }

  // ... 原有的领取逻辑
};
```

## 推荐实施步骤

1. **第一阶段**：为 ClaimMix.tsx 添加自动分批功能
   - 优先级：高
   - 工作量：2-3 小时
   - 影响：解决最常见的 Gas 不足问题

2. **第二阶段**：优化 Machine.tsx 的用户体验
   - 优先级：中
   - 工作量：1-2 小时
   - 影响：提供更好的引导和提示

3. **第三阶段**：添加手动选择功能（可选）
   - 优先级：低
   - 工作量：3-4 小时
   - 影响：提供更灵活的控制

## Gas 消耗参考

根据合约分析：

- 基础 Gas：~150,000
- 每个矿机：~50,000-100,000
- 建议每批：5-10 个矿机
- 总 Gas limit：150,000 + (矿机数量 × 75,000)

示例：

- 5 个矿机：~525,000 gas ✅ 安全
- 10 个矿机：~900,000 gas ✅ 安全
- 20 个矿机：~1,650,000 gas ⚠️ 可能不足
- 30 个矿机：~2,400,000 gas ❌ 很可能失败

## 测试建议

1. **小批量测试**（1-3 个矿机）
2. **中批量测试**（5-10 个矿机）
3. **大批量测试**（20+ 个矿机，验证分批逻辑）
4. **边界测试**（恰好 10 个、11 个等）
5. **失败恢复测试**（中途失败后的状态）
