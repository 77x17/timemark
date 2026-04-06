const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.array("images"), async (req, res) => {
    try {
        const files = req.files;

        const result = await processImages(files);

        res.json({
            success: true,
            data: result
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Processing failed" });
    }
});

module.exports = router;