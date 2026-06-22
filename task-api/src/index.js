require("dotenv").config();
const express = require("express");
const cors = require("cors");

const tasksRouter = require("./routes/tasks.routes");
const categoriesRouter = require("./routes/categories.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Asikaso API is running");
});

app.use("/tasks", tasksRouter);
app.use("/categories", categoriesRouter);

// Fallback handler — unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Centralized error handler — catches anything thrown/rejected in route
// handlers that wasn't already caught locally (e.g. malformed JSON body,
// unexpected DB connection failures). Keeps error shape consistent for the
// frontend's generic error-message fallback.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[unhandled]", err);
  res
    .status(500)
    .json({ error: "Something went wrong on our end. Please try again." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
