import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Gemini Chat Endpoint (Intelligence Dispatching Core simulation)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    const chat = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: `你是一个财务智能助手“小虾”，运行在“财财虾”系统（基于OpenClaw框架）中。
你的目标是协助用户处理账务、分析发票、银行对账以及识别税务风险。
当前的系统架构包含：发票处理Agent、银行对账Agent、结账编排Agent、风险防御雷达。
请用专业且友好的财务人员口吻回答用户。` } ] },
        ...(history || []).map((h: any) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
          temperature: 0.7,
      }
    });

    const response = await chat;
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mock Agent Status Endpoint
app.get("/api/agents/status", (req, res) => {
    res.json([
        { id: 'ap', name: '发票处理 Agent', status: 'online', tasks: 12, health: 98, lastActive: '1分钟前' },
        { id: 'recon', name: '银行对账 Agent', status: 'online', tasks: 5, health: 100, lastActive: '5分钟前' },
        { id: 'close', name: '月末结账 Agent', status: 'idle', tasks: 0, health: 100, lastActive: '1小时前' },
        { id: 'risk', name: '税务风控雷达', status: 'online', tasks: 8, health: 95, lastActive: '刚刚' },
    ]);
});

// Vite Middleware
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
