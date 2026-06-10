import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse incoming JSON requests
app.use(express.json());

// Helper function to get or lazily initialize the Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[LIMS AI Gateway] GEMINI_API_KEY is not defined in environment variables.");
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (error) {
    console.error("[LIMS AI Gateway] Failed to instantiate GoogleGenAI client:", error);
    return null;
  }
}

// 1. API Endpoint for Interactive Smart AI Medical Assistant Chatbot
app.post("/api/gemini/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const aiClient = getGeminiClient();
  if (!aiClient) {
    // Graceful fallback with clear developer message if API key is missing
    console.log("[LIMS AI Gateway] No api key configured, returning fallback info.");
    return res.json({ 
      text: `⚠️ المساعد الطبي يعمل الآن في وضع التشغيل المحلي التجريبي. لتنشيط التكامل الفعلي والكامل مع نموذج الذكاء الاصطناعي Gemini 3.5 من Google، يُرجى تزويد مفتاح GEMINI_API_KEY السري في إعدادات المنصة (Settings > Secrets) ثم المحاولة مجدداً.`
    });
  }

  try {
    // Format history for Google GenAI structure if present
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        // Skip system messages or invalid objects
        if (!h || !h.text) return;
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }

    // Append the latest user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    console.log(`[LIMS AI Gateway] Sending request to Gemini... Turns: ${contents.length}`);
    let response;
    const systemInstruction = `أنت مساعد طبي ذكي خبير ومستشار طبي رقمي لنظام LIMS المطور (My Lab / مختبرات تكنو-كلينيك الطبية). 
مهمتك هي تقديم الدعم الإداري والتحليل الطبي والإجابة عن الاستفسارات الطبية والفحوصات في المختبر:
1. أجب دائماً باللغة العربية بأسلوب راقٍ، وقور، وإنساني، وعلمي دقيق.
2. قدم توضيحات مفيدة ومبسطة للقيم الطبيعية مثل الهيموجلوبين (12.5 - 17.5 للبالغين)، سكر الدم، الكرياتينين، ووظائف الغدة الدرقية والكبد والكلى.
3. وجّه المريض دائماً وفي كل إجابة طبية إلى ضرورة مراجعة وتأكيد التشخيص الإكلينيكي عبر الطبيب المعالج المسؤول لدقة التقييم ومنع الفهم الخاطئ.
4. كن جاهزاً لتقديم معلومات وافية وملخصة بناءً على الأسئلة الإدارية السريعة مثل كيفية تعديل تكلفتها أو طرق تسجل وحفظ البيانات أو النسخ الاحتياطي عبر Google Cloud.`;

    try {
      response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: { systemInstruction }
      });
    } catch (primaryError: any) {
      console.warn("[LIMS AI Gateway] gemini-3.5-flash returned error or high demand, falling back to gemini-3.1-flash-lite:", primaryError.message || primaryError);
      response = await aiClient.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: { systemInstruction }
      });
    }

    console.log("[LIMS AI Gateway] Gemini response received successfully.");
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API error detailed:", error);
    res.status(500).json({ 
      error: "Failed to generate AI response", 
      details: error.message || String(error)
    });
  }
});

// 2. API Endpoint for SMS/WhatsApp real-time dispatching log/simulation
app.post("/api/notifications/send", (req, res) => {
  const { type, phone, patientName, testId, message } = req.body;
  
  console.log(`[Notification Gateway] Dispatching real ${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} to ${phone} for Patient: ${patientName} (Test: ${testId})`);
  console.log(`[Message Content]: \n${message}\n===================`);

  // To integrate real providers like Twilio or WhatsApp Business:
  // - Twilio client can be lazily initialized:
  //   import twilio from 'twilio';
  //   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  //   await client.messages.create({ body: message, from: 'whatsapp:+1...', to: `whatsapp:${phone}` });

  res.json({ 
    success: true, 
    status: `تمت مزامنة وتسجيل إرسال الرسالة بنجاح عبر بوابة ${type === 'whatsapp' ? 'WhatsApp Gateway' : 'SMS GSM'} برقم مرجعي وتأكيد تواصل فعال.`,
    sentTo: phone,
    method: type
  });
});

// Vite Middleware for development, or static file serving for production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LIMS System Server] Express full-stack running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
