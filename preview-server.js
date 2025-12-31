import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取本机局域网 IP 地址
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部地址和非 IPv4 地址
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const app = express();

app.use(express.static(path.join(__dirname, "dist")));

// 处理所有路由，返回 index.html (SPA fallback)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = 3001;
const localIP = getLocalIP();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Preview server running at http://0.0.0.0:${PORT}`);
  console.log(`Access from mobile: http://${localIP}:${PORT}`);
  console.log(`\n📱 手机访问地址: http://${localIP}:${PORT}`);
  console.log(`💻 本机访问地址: http://localhost:${PORT}`);
});
