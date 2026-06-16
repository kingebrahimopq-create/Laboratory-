import { Router, Request, Response } from "express";

const router = Router();

// البحث عن مريض
router.post("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      res.status(400).json({ error: "Phone and name are required" });
      return;
    }

    // هنا سيتم البحث الفعلي في قاعدة البيانات لاحقاً
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
router.get("/:phone/tests", async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.params;

    if (!phone) {
      res.status(400).json({ error: "Phone is required" });
      return;
    }

    // هنا سيتم جلب التحاليل الفعلية من قاعدة البيانات لاحقاً
    const tests: any[] = [];

    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// إضافة مريض جديد (متطلب جديد)
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email } = req.body;
    
    if (!name || !phone) {
      res.status(400).json({ error: "Name and phone are required" });
      return;
    }

    // منطق الإضافة لقاعدة البيانات سيتم وضعه هنا
    res.status(201).json({ message: "Patient registered successfully", patient: { name, phone, email } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
