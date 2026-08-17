import { Router, type IRouter } from "express";
import healthRouter from "./health";
import discoveryRouter from "./discovery";
import misRouter from "./mis";
import authRouter from "./auth";
import adminRouter from "./admin";
import businessRouter from "./business";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(businessRouter);
router.use(discoveryRouter);
router.use(misRouter);

export default router;
