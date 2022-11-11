import express from "express";
import createError from "http-errors";
import logger from "morgan";
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import soundsRouter from "./routes/sounds.js";
import categoriesRouter from "./routes/categories.js";
import commentsRouter from "./routes/comments.js";
import * as config from "./config.js";
import path from "path";
import { fileURLToPath } from 'url';

import mongoose from 'mongoose';
mongoose.Promise = Promise;
mongoose.connect(config.databaseUrl);


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/sounds", soundsRouter);
app.use("/categories", categoriesRouter);
app.use("/comments", commentsRouter);
app.use("/docs", express.static(path.join(__dirname, "docs")));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});


export default app;

