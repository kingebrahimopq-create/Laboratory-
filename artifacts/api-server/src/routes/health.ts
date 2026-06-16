import { Router, Request, Response } from "express";

const router = Router();

router.get("/healthz", (_req: Request, res: Response): Response | void => {
  try {
    return res.json({ status: "ok" });
  } catch (error) {
    return res.status(500).json({ error: "Health check failed" });
  }
});

export default router;
