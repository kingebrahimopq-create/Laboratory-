import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

const fixedAppContent = `import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  (pinoHttp as any)({
    logger,
    serializers: {
      req(req: Request) {
        return {
          id: (req as any).id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
`;

try {
  const filePath = path.join(repoDir, 'artifacts/api-server/src/app.ts');
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fixedAppContent, 'utf-8');
    console.log("Updated app.ts with fixes.");

    // Commit and push
    execSync(`git -C ${repoDir} config user.name "kingebrahimopq-create"`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} config user.email "gokerebrahimopq@gmail.com"`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} add .`, { stdio: 'inherit' });
    
    // Check if there are changes
    const status = execSync(`git -C ${repoDir} status --porcelain`, { encoding: 'utf-8' });
    if (status.trim().length > 0) {
      execSync(`git -C ${repoDir} commit -m "fix: resolve TypeScript errors in api-server app.ts"`, { stdio: 'inherit' });
      execSync(`git -C ${repoDir} push origin main`, { stdio: 'inherit' });
      console.log("Pushed fixes to origin main.");
    } else {
      console.log("No changes detected in git.");
    }
  } else {
    console.log("File not found: " + filePath);
  }
} catch (e: any) {
  console.error("Error applying fixes:", e.message || e);
}
