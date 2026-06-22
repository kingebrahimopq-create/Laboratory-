import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

// Load local .env if available
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Firebase Admin with credentials from environment variables
let firestoreDb: Firestore | null = null;
try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
  const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");
  
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedPrivateKey,
        }),
      });
    }
    firestoreDb = getFirestore();
    console.log("Firebase Admin SDK initialized successfully.");
  } else {
    console.warn("Firebase credentials missing. Firestore API is running in local backup mode.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error);
}

// In-memory data store for local backup mode (if Firebase credentials are not fully active or configured)
const localVaccinations: any[] = [];

const localLabResults: any[] = [];

// Helper to interact with git/github updater properties
let currentCommitSha = "7D087AF7"; // Initially mocked with latest PR hash, changes when a real GitHub sync is run.
let githubSyncEnabled = true;
let isUpdating = false;

const GITHUB_OWNER = "kingebrahimopq-create";
const GITHUB_REPO = "Laboratory-";
const GITHUB_PAT = process.env.GITHUB_PAT || "";

// GitHub API headers
const getGithubHeaders = () => ({
  "Accept": "application/vnd.github+json",
  "Authorization": `token ${GITHUB_PAT}`,
  "User-Agent": "Laboratory-App-Updater"
});

// Recursively download files from GitHub
async function downloadDir(dirPath: string = "") {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${dirPath}`;
  const res = await fetch(url, { headers: getGithubHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub API returned status ${res.status}`);
  }
  const items = await res.json() as any[];
  for (const item of items) {
    if (item.type === "dir") {
      // Avoid circular or excessive folder syncing
      if (
        item.name === "node_modules" ||
        item.name === "dist" ||
        item.name === ".git" ||
        item.name === ".github" ||
        item.name === "assets"
      ) {
        continue;
      }
      
      const localDirPath = path.join(process.cwd(), item.path);
      if (!fs.existsSync(localDirPath)) {
        fs.mkdirSync(localDirPath, { recursive: true });
      }
      await downloadDir(item.path);
    } else if (item.type === "file") {
      // Only pull code and configurations related to construction & styling
      if (
        item.name.endsWith(".jpg") ||
        item.name.endsWith(".png") ||
        item.name.endsWith(".ico") ||
        item.name === ".env"
      ) {
        continue;
      }
      
      const fileRes = await fetch(item.download_url, { headers: getGithubHeaders() });
      if (fileRes.ok) {
        const text = await fileRes.text();
        const localFilePath = path.join(process.cwd(), item.path);
        
        const parentDir = path.dirname(localFilePath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        
        fs.writeFileSync(localFilePath, text, "utf-8");
      }
    }
  }
}

// ==================== REST ENDPOINTS ====================

// 1. Google OAuth Endpoints
app.get("/api/auth/google-url", (req, res) => {
  const clientOrigin = (req.query.origin as string) || process.env.APP_URL || `http://localhost:${PORT}`;
  const redirectUri = `${clientOrigin.replace(/\/$/, "")}/auth/callback`;
  
  const googleClientId = process.env.GOOGLE_CLIENT_ID || "12279673341-qevn7tdgfvtr8tmr9c3kl3qdj10obk00.apps.googleusercontent.com";
  
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/drive.file"
  ];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    state: clientOrigin,
    access_type: "offline",
    prompt: "consent"
  }).toString();

  res.json({ url: authUrl });
});

// Google OAuth Redirect Handling
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, state } = req.query;
  const clientOrigin = (state as string) || process.env.APP_URL || `http://localhost:${PORT}`;
  const redirectUri = `${clientOrigin.replace(/\/$/, "")}/auth/callback`;

  if (!code) {
    return res.status(400).send("No authorization code provided.");
  }

  try {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const googleClientId = process.env.GOOGLE_CLIENT_ID || "12279673341-qevn7tdgfvtr8tmr9c3kl3qdj10obk00.apps.googleusercontent.com";
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "BKl7xUi_gsp9AmsmTLW5ca6vIfgFdzvbsbc1H69BppXBYpqLXwxPwPxHIs-5NzCG7iKz63pI8kHbPJ5g_aKm0rk";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google token exchange failed: ${errText}`);
    }

    const tokenData = await response.json() as any;
    const accessToken = tokenData.access_token;
    
    // Fetch profile details
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    
    const profileData = await profileRes.json() as any;

    res.send(`
      <!doctype html>
      <html>
        <head>
          <title>تسجيل الدخول ناجح</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 50px; background-color: #f7fafc; color: #2d3748; }
            .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block; max-width: 400px; }
            h1 { color: #0d9488; }
            p { font-size: 16px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>تم الاتصال بنجاح!</h1>
            <p>مرحباً <strong>${profileData.name || "العضو الجديد"}</strong>، تم إثبات الهوية وتسجيل الدخول عبر Google بنجاح.</p>
            <p>يتم الآن إعادة الاتصال بلوحة التحكم وإغلاق هذه النافذة تلقائياً...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: "GOOGLE_AUTH_SUCCESS",
                token: "${accessToken}",
                profile: ${JSON.stringify(profileData)}
              }, "*");
              window.close();
            } else {
              window.location.href = "/";
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("OAuth Exchange Error:", err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// 2. Google Drive API Proxies
app.get("/api/drive/files", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const driveRes = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,webViewLink)&q=mimeType!='application/vnd.google-apps.folder'", {
      headers: { "Authorization": authHeader }
    });

    if (!driveRes.ok) {
      throw new Error(`Drive retrieval failing with status ${driveRes.status}`);
    }

    const driveData = await driveRes.json() as any;
    res.json(driveData.files || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/drive/upload", express.raw({ type: "application/json", limit: "10mb" }), async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const bodyObj = JSON.parse(req.body.toString());
    const { name, content, mimeType } = bodyObj;

    // We do a simple multipart upload or simple media upload
    const metadata = { name: name, mimeType: mimeType || "text/plain" };
    
    // Create base64 buffer or utf8 blob
    const fileContent = content || "";

    const boundary = "boundary_laboratory";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody = 
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType || "text/plain"}\r\n\r\n` +
      fileContent +
      closeDelimiter;

    const driveRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": multipartBody.length.toString()
      },
      body: multipartBody
    });

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      throw new Error(`Google Upload failure: ${errText}`);
    }

    const uploadedFile = await driveRes.json();
    res.json(uploadedFile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GitHub Application Repository Auto-Sync & Manual Sync Endpoints
app.get("/api/github/status", async (req, res) => {
  try {
    // Fetch latest commit hash on GitHub
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=1`;
    const response = await fetch(url, { headers: getGithubHeaders() });
    
    let latestSha = currentCommitSha;
    let latestDate = new Date().toISOString();
    let commitMessage = "التكامل مع المستودع مفعل";

    if (response.ok) {
      const data = await response.json() as any[];
      if (data && data.length > 0) {
        latestSha = data[0].sha.substring(0, 8);
        latestDate = data[0].commit.author.date;
        commitMessage = data[0].commit.message;
      }
    }

    res.json({
      configured: !!GITHUB_PAT,
      currentSha: currentCommitSha,
      latestSha: latestSha,
      latestDate: latestDate,
      commitMessage: commitMessage,
      syncEnabled: githubSyncEnabled,
      isUpdating: isUpdating,
      repoUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
    });
  } catch (err: any) {
    res.json({
      configured: !!GITHUB_PAT,
      currentSha: currentCommitSha,
      latestSha: currentCommitSha,
      syncEnabled: githubSyncEnabled,
      isUpdating: false,
      error: err.message
    });
  }
});

app.post("/api/github/toggle-sync", (req, res) => {
  githubSyncEnabled = req.body.enabled !== false;
  res.json({ enabled: githubSyncEnabled });
});

// Endpoint to pull the latest workspace code directly from GitHub
app.post("/api/github/pull", async (req, res) => {
  if (isUpdating) {
    return res.status(409).json({ error: "تجرى حالياً عملية تحديث أخرى" });
  }

  isUpdating = true;
  try {
    // 1. Fetch latest commit
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=1`;
    const response = await fetch(url, { headers: getGithubHeaders() });
    let latestSha = currentCommitSha;
    if (response.ok) {
      const data = await response.json() as any[];
      if (data && data.length > 0) {
        latestSha = data[0].sha.substring(0, 8);
      }
    }

    // 2. Perform the download
    await downloadDir();
    
    currentCommitSha = latestSha;
    isUpdating = false;
    res.json({ success: true, updatedToSha: currentCommitSha });
  } catch (err: any) {
    isUpdating = false;
    res.status(500).json({ error: `فشل التحميل التلقائي: ${err.message}` });
  }
});

// Endpoint to push a new vaccination/lab report record as a mock commit (or push project modification files) to GitHub for full loop
app.post("/api/github/push", async (req, res) => {
  const { filename, fileContent, commitMessage } = req.body;
  if (!filename || !fileContent) {
    return res.status(400).json({ error: "اسم الملف ومحتواه مطلوب" });
  }

  try {
    const filePath = filename;
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
    
    // Check if file already exists on GitHub to obtain its sha
    let fileSha: string | null = null;
    const checkRes = await fetch(url, { headers: getGithubHeaders() });
    if (checkRes.ok) {
      const fileData = await checkRes.json() as any;
      fileSha = fileData.sha;
    }

    // Encode file content
    const base64Content = Buffer.from(fileContent).toString("base64");

    const body: any = {
      message: commitMessage || `Update ${filename} via Laboratory application automatic publisher`,
      content: base64Content,
    };
    if (fileSha) {
      body.sha = fileSha;
    }

    const pushRes = await fetch(url, {
      method: "PUT",
      headers: {
        ...getGithubHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!pushRes.ok) {
      const errTxt = await pushRes.text();
      throw new Error(`GitHub Upload error: ${errTxt}`);
    }

    const pushData = await pushRes.json() as any;
    currentCommitSha = pushData.commit.sha.substring(0, 8);

    res.json({ success: true, commitSha: currentCommitSha });
  } catch (err: any) {
    res.status(500).json({ error: `فشل الرفع التلقائي إلى المستودع: ${err.message}` });
  }
});

// 4. Vaccination and Lab Result standard APIs (utilizing Firebase or Local Store fallback)
app.get("/api/vaccinations", async (req, res) => {
  try {
    if (firestoreDb) {
      const snap = await firestoreDb.collection("vaccinations").orderBy("createdAt", "desc").get();
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(list);
    }
  } catch (error) {
    console.error("Firestore loading vaccinations failed, using fallback:", error);
  }
  res.json(localVaccinations);
});

app.post("/api/vaccinations", async (req, res) => {
  const { patientName, patientId, vaccineType, vaccineDate, doseNumber, status, notes } = req.body;
  const newRecord = {
    patientName,
    patientId: patientId || "P" + Math.floor(1000 + Math.random() * 9000),
    vaccineType,
    vaccineDate,
    doseNumber: Number(doseNumber) || 1,
    status: status || "Completed",
    notes: notes || "",
    createdAt: new Date().toISOString()
  };

  try {
    if (firestoreDb) {
      const docRef = await firestoreDb.collection("vaccinations").add(newRecord);
      return res.json({ id: docRef.id, ...newRecord });
    }
  } catch (error) {
    console.error("Firestore saving vaccination failed, using fallback:", error);
  }

  // Fallback state manipulation
  const fallbackRecord = { id: "v_" + Date.now(), ...newRecord };
  localVaccinations.unshift(fallbackRecord);
  res.json(fallbackRecord);
});

// Lab Results endpoints
app.get("/api/lab-results", async (req, res) => {
  try {
    if (firestoreDb) {
      const snap = await firestoreDb.collection("lab_results").orderBy("createdAt", "desc").get();
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(list);
    }
  } catch (error) {
    console.error("Firestore loading lab_results failed, using fallback:", error);
  }
  res.json(localLabResults);
});

app.post("/api/lab-results", async (req, res) => {
  const { patientName, testType, testValue, status, testDate, notes } = req.body;
  const newResult = {
    patientName,
    testType,
    testValue,
    status: status || "Released",
    testDate,
    notes: notes || "",
    createdAt: new Date().toISOString()
  };

  try {
    if (firestoreDb) {
      const docRef = await firestoreDb.collection("lab_results").add(newResult);
      return res.json({ id: docRef.id, ...newResult });
    }
  } catch (error) {
    console.error("Firestore saving lab_result failed, using fallback:", error);
  }

  const fallbackResult = { id: "l_" + Date.now(), ...newResult };
  localLabResults.unshift(fallbackResult);
  res.json(fallbackResult);
});

// DELETE vaccine record
app.delete("/api/vaccinations/:id", async (req, res) => {
  const id = req.params.id;
  try {
    if (firestoreDb) {
      await firestoreDb.collection("vaccinations").doc(id).delete();
      return res.json({ success: true });
    }
  } catch (error) {
    console.error("Firestore delete failed:", error);
  }
  const index = localVaccinations.findIndex(v => v.id === id);
  if (index !== -1) {
    localVaccinations.splice(index, 1);
  }
  res.json({ success: true });
});

// ==================== BACKGROUND SYNC THREAD ====================
// Periodic polling to auto-update in the background if enabled
setInterval(async () => {
  if (!githubSyncEnabled || isUpdating || !GITHUB_PAT) return;
  
  try {
    // 1. Fetch latest commit sha
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=1`;
    const response = await fetch(url, { headers: getGithubHeaders() });
    
    if (response.ok) {
      const data = await response.json() as any[];
      if (data && data.length > 0) {
        const latestSha = data[0].sha.substring(0, 8);
        
        // If there's an update, perform silent sync pull
        if (latestSha !== currentCommitSha) {
          console.log(`[Auto-Sync] New repository update found (${latestSha}). Fetching...`);
          isUpdating = true;
          await downloadDir();
          currentCommitSha = latestSha;
          isUpdating = false;
          console.log("[Auto-Sync] Local workspace files updated to match GitHub automatically!");
        }
      }
    }
  } catch (err: any) {
    console.error("[Auto-Sync Error]", err.message);
    isUpdating = false;
  }
}, 45000); // Polling every 45s

// ==================== VITE MIDDLEWARE CONFIGURATION ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`Server fully responding on port ${PORT}`);
  });
}

startServer();
