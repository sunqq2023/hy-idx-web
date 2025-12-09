# mimir 加密说明

## 加密方案

使用自定义 XOR 加密算法对 mimir 地址进行加密，增加逆向难度。

### 加密特点

1. **双重密钥派生** - 使用两个不同的密钥源进行 XOR 组合
2. **位运算混淆** - 密钥派生过程使用位运算增加复杂度
3. **Base64 编码** - 最终结果使用 Base64 编码，看起来像随机字符串
4. **短变量名** - 使用 `_d`, `_k`, `_x`, `_r`, `_g` 等简短变量名降低可读性

### 如何添加新地址

1. 创建临时加密脚本（使用后立即删除）：

```javascript
// encrypt-new-address.js
const _k = (s) => {
  const r = [];
  for (let i = 0; i < s.length; i++) {
    r.push(s.charCodeAt(i) ^ i % 7);
  }
  return r;
};

const _x = (text, key) => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key[i % key.length]);
  }
  return Buffer.from(result).toString("base64");
};

const encrypt = (address) => {
  const k1 = _k("idx" + "chain" + "2024");
  const k2 = _k(String(0x1a2b3c));
  const combined = k1.map((v, i) => v ^ k2[i % k2.length]);
  return _x(address, combined);
};

// 替换为你要加密的地址
const newAddress = "0xYourNewAddressHere";
console.log(encrypt(newAddress));
```

2. 运行脚本：`node encrypt-new-address.js`
3. 将输出的加密字符串添加到 `src/hooks/useMimirList.ts` 的 `_d` 数组中
4. **立即删除** `encrypt-new-address.js` 文件

### 安全提示

⚠️ **重要**：

- 这是混淆而非真正的加密，有经验的开发者仍可破解
- 不要在代码仓库中保留包含明文地址的加密脚本
- 真正的安全应该在智能合约层面实现
- 此方案仅用于增加前端逆向的难度，防止简单的文本搜索

### 解密原理

前端代码中的解密函数：

- `_k()` - 密钥派生函数
- `_x()` - XOR 解密函数
- `_r()` - 主解密函数（组合两个密钥）
- `_g()` - 获取解密后的地址列表

密钥来源：

- 字符串: "idxchain2024"
- 十六进制数: 0x1a2b3c
- 两者通过 XOR 运算组合
