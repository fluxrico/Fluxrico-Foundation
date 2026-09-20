import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import subscriptionRouter from "./subscription";
import billingRouter from "./billing";
import journeyRouter from "./journey";
import accountRouter from "./account";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(subscriptionRouter);
router.use(billingRouter);
router.use(journeyRouter);
router.use(accountRouter);

export default router;
