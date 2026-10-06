import { Router, type IRouter } from "express";
import healthRouter from "./health";
import discoveryRouter from "./discovery";
import misRouter from "./mis";
import authRouter from "./auth";
import adminRouter from "./admin";
import businessRouter from "./business";
import storageRouter from "./storage";
import medicalUnderwritingRouter from "./medical-underwriting";
import notificationsRouter from "./notifications";
import cashierRouter from "./cashier";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(medicalUnderwritingRouter);
router.use(notificationsRouter);
router.use(cashierRouter);
router.use(businessRouter);
router.use(discoveryRouter);
router.use(misRouter);

export default router;
