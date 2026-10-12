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
import pricingReviewRouter from "./pricing-review";
import recordFilingRouter from "./record-filing";
import giRouter from "./gi";
import businessStatusRouter from "./business-status";
import riskRegisterRouter from "./risk-register";
import clientRatingsRouter from "./client-ratings";

const router: IRouter = Router();
router.use(riskRegisterRouter);
router.use(clientRatingsRouter);

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(medicalUnderwritingRouter);
router.use(notificationsRouter);
router.use(cashierRouter);
router.use(pricingReviewRouter);
router.use(recordFilingRouter);
router.use(giRouter);
router.use(businessStatusRouter);
router.use(businessRouter);
router.use(discoveryRouter);
router.use(misRouter);

export default router;
