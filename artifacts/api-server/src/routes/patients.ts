import { Router, Request, Response } from "express";

const router = Router();

// البحث عن مريض
router.post("/search", async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: "Phone and name are required" });
    }

    const patient = {
      id: "patient-1",
      name,
      phone,
      email: "patient@example.com",
    };

    return res.json(patient);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// الحصول على تحاليل المريض
router.get("/:phone/tests", async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }

    const tests: any[] = [];
    return res.json(tests);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// إضافة مريض جديد
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, phone, email } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    return res.status(201).json({ message: "Patient registered successfully", patient: { name, phone, email } });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
// Force rebuild - Tue Jun 16 20:37:05 UTC 2026
