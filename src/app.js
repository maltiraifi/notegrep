import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import documentRoutes from "./routes/document.route.js";

import "./workers/extract.worker.js";
import "./workers/chunk.worker.js";
import "./workers/embed.worker.js";
import "./workers/vector.worker.js";
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send({ message: "NoteGrep's API is running! " });
});

app.use("/api/documents", documentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
