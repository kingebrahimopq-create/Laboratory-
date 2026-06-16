import { Router, Request, Response } from "express";

const router = Router();

// البحث عن مريض
router.post("/search", async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: "Phone and name are required" });
    }

    // هنا يتم البحث في قاعدة البيانات
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
router.get("/:phone/tests", async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }

    // هنا يتم جلب تحاليل المريض من قاعدة البيانات
    const tests: any[] = [];

    return res.json(tests);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
