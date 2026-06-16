import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import labRouter from "./lab";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/patients", patientsRouter);
router.use("/lab", labRouter);

export default router;
