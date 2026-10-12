import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { isLocalRuntime } from "./lib/local-runtime";
import { localUploadRouter } from "./lib/local-storage";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0].replace(/(\/storage\/local-upload\/)[^/]+/, "$1[redacted]"),
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
if (isLocalRuntime()) app.use("/api", localUploadRouter);
// Only the bounded, authenticated register import accepts a larger JSON envelope.
// Source is limited separately to 60 KiB; escaped multiline JSON can be larger on the wire.
app.use("/api/risk-register/import", express.json({ limit: "512kb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
