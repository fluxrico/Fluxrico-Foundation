import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import subscriptionRouter from "./subscription.js";
import billingRouter from "./billing.js";
import journeyRouter from "./journey.js";
import accountRouter from "./account.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(subscriptionRouter);
router.use(billingRouter);
router.use(journeyRouter);
router.use(accountRouter);

export default router;
