#!/bin/bash

# 矿机激活失败诊断脚本
# 使用方法: ./diagnose-activation.sh <交易哈希>
# 示例: ./diagnose-activation.sh 0x061ef4da5783d3b55bb599b2cfb02991c3679fba18a5168cacb566e653cc7cc9

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# BSC 主网合约地址
STORAGE_ADDRESS="0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2"
LOGIC_ADDRESS="0x895e8B68D93b2cD5fF4F2bf22cCb3697235C7AfD"
EXTEND_LOGIC_ADDRESS="0x1AAE73285d2bc36fe25e9b935f3a8f8E8f5776d0"
EXTEND_STORAGE_ADDRESS="0xdc567714763206341aC1d90C0d2fc58c57739412"
IDX_TOKEN="0xc98F60B3F98E8Bf860436746db637e13B0e17458"
RPC_URL="https://bsc.publicnode.com"

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请提供交易哈希${NC}"
    echo "使用方法: $0 <交易哈希>"
    echo "示例: $0 0x061ef4da5783d3b55bb599b2cfb02991c3679fba18a5168cacb566e653cc7cc9"
    exit 1
fi

TX_HASH=$1

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   矿机激活失败诊断工具${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${BLUE}交易哈希:${NC} $TX_HASH"
echo -e "${BLUE}BSCScan:${NC} https://bscscan.com/tx/$TX_HASH"
echo ""

# 1. 获取交易信息
echo -e "${PURPLE}[1/8] 获取交易信息...${NC}"
TX_INFO=$(cast tx $TX_HASH --rpc-url $RPC_URL 2>&1)

if echo "$TX_INFO" | grep -q "error"; then
    echo -e "${RED}❌ 无法获取交易信息，请检查交易哈希是否正确${NC}"
    exit 1
fi

FROM_ADDRESS=$(echo "$TX_INFO" | grep "from" | awk '{print $2}')
TO_ADDRESS=$(echo "$TX_INFO" | grep "^to" | awk '{print $2}')
GAS_LIMIT=$(echo "$TX_INFO" | grep "gasLimit" | awk '{print $2}')

echo -e "${GREEN}✓${NC} 用户地址: $FROM_ADDRESS"
echo -e "${GREEN}✓${NC} 合约地址: $TO_ADDRESS"
echo -e "${GREEN}✓${NC} Gas Limit: $GAS_LIMIT"
echo ""

# 2. 获取交易收据
echo -e "${PURPLE}[2/8] 获取交易收据...${NC}"
RECEIPT=$(cast receipt $TX_HASH --rpc-url $RPC_URL 2>&1)

STATUS=$(echo "$RECEIPT" | grep "^status" | awk '{print $2}')
GAS_USED=$(echo "$RECEIPT" | grep "gasUsed" | awk '{print $2}')

if [ "$STATUS" = "1" ]; then
    echo -e "${GREEN}✓${NC} 交易状态: 成功"
    echo -e "${YELLOW}⚠️  交易已成功，无需诊断${NC}"
    exit 0
else
    echo -e "${RED}✗${NC} 交易状态: 失败"
    echo -e "${GREEN}✓${NC} Gas 使用: $GAS_USED / $GAS_LIMIT"
fi
echo ""

# 3. 尝试模拟调用获取错误信息
echo -e "${PURPLE}[3/8] 分析失败原因...${NC}"

# 解析输入数据获取矿机ID
INPUT_DATA=$(echo "$TX_INFO" | grep "^input" | cut -d' ' -f2-)
# 提取第一个矿机ID（用于测试）- 兼容 macOS
FIRST_MACHINE_ID=$(echo "$INPUT_DATA" | sed -E 's/.*0{63}([0-9a-f]+).*/\1/' | head -1)
if [ -n "$FIRST_MACHINE_ID" ]; then
    FIRST_MACHINE_ID=$((16#$FIRST_MACHINE_ID))
else
    FIRST_MACHINE_ID=0
fi

echo -e "${BLUE}检测到矿机ID:${NC} $FIRST_MACHINE_ID (仅显示第一个)"

# 尝试模拟调用
CALL_RESULT=$(cast call $LOGIC_ADDRESS "batchActivateMachinesWithLP(uint256[])" "[$FIRST_MACHINE_ID]" --from $FROM_ADDRESS --rpc-url $RPC_URL 2>&1 || true)

if echo "$CALL_RESULT" | grep -q "0x4e487b710000000000000000000000000000000000000000000000000000000000000011"; then
    echo -e "${RED}✗ 错误类型: Panic(0x11) - 算术下溢/上溢${NC}"
    echo -e "${YELLOW}  这是合约 Bug！用户的奖励记录超过上限导致下溢${NC}"
    UNDERFLOW_ERROR=true
elif echo "$CALL_RESULT" | grep -q "execution reverted"; then
    echo -e "${RED}✗ 错误类型: 执行回滚${NC}"
    # 兼容 macOS - 使用 sed 替代 grep -P
    ERROR_MSG=$(echo "$CALL_RESULT" | sed -n 's/.*execution reverted: \(.*\)/\1/p' | head -1)
    if [ -z "$ERROR_MSG" ]; then
        ERROR_MSG="未知原因"
    fi
    echo -e "${YELLOW}  错误信息: $ERROR_MSG${NC}"
else
    echo -e "${YELLOW}⚠️  无法通过模拟调用获取详细错误${NC}"
fi
echo ""

# 4. 检查 IDX 余额
echo -e "${PURPLE}[4/8] 检查 IDX 余额...${NC}"
IDX_BALANCE=$(cast call $IDX_TOKEN "balanceOf(address)(uint256)" $FROM_ADDRESS --rpc-url $RPC_URL)
# 移除科学计数法标记
IDX_BALANCE=$(echo "$IDX_BALANCE" | awk '{print $1}')
IDX_BALANCE_FORMATTED=$(cast --from-wei $IDX_BALANCE 2>/dev/null || echo "0")

# 获取单台激活费用
LP_USD=$(cast call $LOGIC_ADDRESS "lpUsd()(uint256)" --rpc-url $RPC_URL)
LP_USD=$(echo "$LP_USD" | awk '{print $1}')
SINGLE_COST=$(cast call $LOGIC_ADDRESS "getIDXAmount(uint256)(uint256)" $LP_USD --rpc-url $RPC_URL)
SINGLE_COST=$(echo "$SINGLE_COST" | awk '{print $1}')
SINGLE_COST_FORMATTED=$(cast --from-wei $SINGLE_COST 2>/dev/null || echo "0")

echo -e "${GREEN}✓${NC} IDX 余额: $IDX_BALANCE_FORMATTED IDX"
echo -e "${GREEN}✓${NC} 单台激活费用: $SINGLE_COST_FORMATTED IDX"

# 简单判断（假设激活30台）
ESTIMATED_COST=$(echo "$SINGLE_COST_FORMATTED * 30" | bc)
if (( $(echo "$IDX_BALANCE_FORMATTED < $ESTIMATED_COST" | bc -l) )); then
    echo -e "${RED}✗ IDX 余额可能不足（估算需要 $ESTIMATED_COST IDX）${NC}"
else
    echo -e "${GREEN}✓${NC} IDX 余额充足"
fi
echo ""

# 5. 检查 IDX 授权
echo -e "${PURPLE}[5/8] 检查 IDX 授权...${NC}"
ALLOWANCE=$(cast call $IDX_TOKEN "allowance(address,address)(uint256)" $FROM_ADDRESS $LOGIC_ADDRESS --rpc-url $RPC_URL)
ALLOWANCE=$(echo "$ALLOWANCE" | awk '{print $1}')
ALLOWANCE_FORMATTED=$(cast --from-wei $ALLOWANCE 2>/dev/null || echo "0")

echo -e "${GREEN}✓${NC} 已授权: $ALLOWANCE_FORMATTED IDX"

if (( $(echo "$ALLOWANCE_FORMATTED < $ESTIMATED_COST" | bc -l) )); then
    echo -e "${RED}✗ 授权不足（估算需要 $ESTIMATED_COST IDX）${NC}"
else
    echo -e "${GREEN}✓${NC} 授权充足"
fi
echo ""

# 6. 检查用户激活统计
echo -e "${PURPLE}[6/8] 检查用户激活统计...${NC}"
TOTAL_ACTIVATED=$(cast call $EXTEND_STORAGE_ADDRESS "getTotalActivatedMachines(address)(uint256)" $FROM_ADDRESS --rpc-url $RPC_URL)
TOTAL_ACTIVATED=$(echo "$TOTAL_ACTIVATED" | awk '{print $1}')
ACTIVATED_POWER=$(cast call $EXTEND_STORAGE_ADDRESS "getUserActivatedPower(address)(uint256)" $FROM_ADDRESS --rpc-url $RPC_URL)
ACTIVATED_POWER=$(echo "$ACTIVATED_POWER" | awk '{print $1}')
IDX_REWARD=$(cast call $EXTEND_STORAGE_ADDRESS "getActivatedMachineRewards(address)(uint256)" $FROM_ADDRESS --rpc-url $RPC_URL)
IDX_REWARD=$(echo "$IDX_REWARD" | awk '{print $1}')
IDX_REWARD_FORMATTED=$(cast --from-wei $IDX_REWARD 2>/dev/null || echo "0")

echo -e "${GREEN}✓${NC} 已激活矿机: $TOTAL_ACTIVATED 台"
echo -e "${GREEN}✓${NC} 激活算力: $ACTIVATED_POWER"
echo -e "${GREEN}✓${NC} 已获得 IDX 奖励: $IDX_REWARD_FORMATTED IDX"
echo ""

# 7. 检查算力上限
echo -e "${PURPLE}[7/8] 检查算力上限...${NC}"
ACTIVATED_POWER_LIMIT=$(cast call $EXTEND_LOGIC_ADDRESS "activatedPowerLimit()(uint256)" --rpc-url $RPC_URL)
ACTIVATED_POWER_LIMIT=$(echo "$ACTIVATED_POWER_LIMIT" | awk '{print $1}')
PROMOTION_POWER_LIMIT=$(cast call $EXTEND_LOGIC_ADDRESS "promotionPowerLimit()(uint256)" --rpc-url $RPC_URL)
PROMOTION_POWER_LIMIT=$(echo "$PROMOTION_POWER_LIMIT" | awk '{print $1}')

echo -e "${GREEN}✓${NC} 激活算力上限: $ACTIVATED_POWER_LIMIT"
echo -e "${GREEN}✓${NC} 推广算力上限: $PROMOTION_POWER_LIMIT"

if [ "$ACTIVATED_POWER" -ge "$ACTIVATED_POWER_LIMIT" ]; then
    echo -e "${YELLOW}⚠️  用户激活算力已达上限 ($ACTIVATED_POWER / $ACTIVATED_POWER_LIMIT)${NC}"
fi
echo ""

# 8. 检查 IDX 奖励上限
echo -e "${PURPLE}[8/8] 检查 IDX 奖励上限...${NC}"
IDX_1000U=$(cast call $LOGIC_ADDRESS "getIDXAmount(uint256)(uint256)" 1000 --rpc-url $RPC_URL)
IDX_1000U=$(echo "$IDX_1000U" | awk '{print $1}')
IDX_4000U=$(cast call $LOGIC_ADDRESS "getIDXAmount(uint256)(uint256)" 4000 --rpc-url $RPC_URL)
IDX_4000U=$(echo "$IDX_4000U" | awk '{print $1}')
IDX_4000U_FORMATTED=$(cast --from-wei $IDX_4000U 2>/dev/null || echo "0")

echo -e "${GREEN}✓${NC} 4000U 等值 IDX (上限): $IDX_4000U_FORMATTED IDX"
echo -e "${GREEN}✓${NC} 用户已获得: $IDX_REWARD_FORMATTED IDX"

if (( $(echo "$IDX_REWARD_FORMATTED > $IDX_4000U_FORMATTED" | bc -l) )); then
    echo -e "${RED}✗ 用户已获得的 IDX 奖励超过上限！${NC}"
    echo -e "${RED}  这会导致算术下溢错误 (Panic 0x11)${NC}"
    REWARD_OVERFLOW=true
else
    echo -e "${GREEN}✓${NC} IDX 奖励未超限"
fi
echo ""

# 生成诊断报告
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   诊断结果${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if [ "$UNDERFLOW_ERROR" = true ] || [ "$REWARD_OVERFLOW" = true ]; then
    echo -e "${RED}🔴 问题根因: 合约 Bug - IDX 奖励下溢${NC}"
    echo ""
    echo -e "${YELLOW}详细说明:${NC}"
    echo "  用户已获得的 IDX 奖励 ($IDX_REWARD_FORMATTED IDX) 超过了"
    echo "  当前价格下的上限 ($IDX_4000U_FORMATTED IDX)。"
    echo ""
    echo "  这是因为早期 IDX 价格低时，用户获得了更多 IDX，"
    echo "  而现在 IDX 价格上涨，上限对应的 IDX 数量减少。"
    echo ""
    echo "  合约在计算剩余可发放额度时："
    echo "  activetedReward = $IDX_4000U_FORMATTED - $IDX_REWARD_FORMATTED"
    echo "  会导致算术下溢 (Panic 0x11)，交易回滚。"
    echo ""
    echo -e "${GREEN}解决方案:${NC}"
    echo ""
    echo -e "${YELLOW}方案 1: 临时关闭激活奖励（立即生效）${NC}"
    echo "  cast send $EXTEND_LOGIC_ADDRESS \\"
    echo "    \"setActiveMachineRewardsEnabled(bool)\" false \\"
    echo "    --private-key \$PRIVATE_KEY \\"
    echo "    --rpc-url $RPC_URL"
    echo ""
    echo "  执行后用户可以正常激活矿机，但不会获得奖励。"
    echo ""
    echo -e "${YELLOW}方案 2: 升级合约（长期方案）${NC}"
    echo "  1. 修复合约代码，添加下溢保护"
    echo "  2. 重新部署 LogicExtend 合约"
    echo "  3. 更新 Logic 合约的引用"
    echo "  4. 重新开启激活奖励"
    echo ""
    echo "  详细步骤请参考: DEPLOYMENT_GUIDE.md"
    echo ""
elif (( $(echo "$IDX_BALANCE_FORMATTED < $ESTIMATED_COST" | bc -l) )); then
    echo -e "${RED}🔴 问题根因: IDX 余额不足${NC}"
    echo ""
    echo "  用户需要充值至少 $(echo "$ESTIMATED_COST - $IDX_BALANCE_FORMATTED" | bc) IDX"
    echo ""
elif (( $(echo "$ALLOWANCE_FORMATTED < $ESTIMATED_COST" | bc -l) )); then
    echo -e "${RED}🔴 问题根因: IDX 授权不足${NC}"
    echo ""
    echo "  用户需要重新授权，建议授权额度: $(echo "$ESTIMATED_COST * 30" | bc) IDX"
    echo ""
else
    echo -e "${YELLOW}⚠️  无法确定具体原因，可能需要进一步分析${NC}"
    echo ""
    echo "  建议检查:"
    echo "  1. 矿机状态（是否已激活、已销毁、正在出售）"
    echo "  2. 网络状态（RPC 是否正常）"
    echo "  3. 合约状态（是否有其他限制）"
    echo ""
fi

echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${BLUE}完整交易信息:${NC} https://bscscan.com/tx/$TX_HASH"
echo ""
