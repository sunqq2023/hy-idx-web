import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, "dist")));

// 处理所有路由，返回 index.html (SPA fallback)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Preview server running at http://0.0.0.0:${PORT}`);
  console.log(`Access from mobile: http://192.168.1.176:${PORT}`);
});
