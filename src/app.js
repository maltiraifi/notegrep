import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import documentRoutes from "./routes/document.route.js";

dotenv.config();

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
