import { Router, Request, Response } from "express";

const router = Router();

// البحث عن مريض
router.post("/search", async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      res.status(400).json({ error: "Phone and name are required" });
      return;
    }

    // هنا يتم البحث في قاعدة البيانات
    // للآن نرجع مريض وهمي للاختبار
    const patient = {
      id: "patient-1",
      name,
      phone,
      email: "patient@example.com",
    };

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// الحصول على تحاليل المريض
router.get("/:phone/tests", async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;

    // هنا يتم جلب تحاليل المريض من قاعدة البيانات
    // للآن نرجع قائمة فارغة
    const tests: any[] = [];

    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
