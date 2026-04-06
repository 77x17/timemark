const express = require("express");
const multer = require("multer");
const { processImages } = require("./services/qrService");
const cors = require('cors');

const app = express();

const upload = multer({ dest: "uploads/" });

app.use(cors());

app.post("/upload", upload.array("images"), async (req, res) => {
  try {
    // console.log(req.files);
    const result = await processImages(req.files);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi xử lý" });
  }
});

app.listen(8080, () => {
  console.log("Server chạy tại http://localhost:8080");
});