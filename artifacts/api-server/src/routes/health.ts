import { Router, Request, Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router = Router();

router.get("/healthz", (_req: Request, res: Response): any => {
  try {
    const data = HealthCheckResponse.parse({ status: "ok" });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Health check failed" });
  }
});

export default router;
