const fs = require("fs");
const sharp = require("sharp");
const {
  MultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  RGBLuminanceSource,
  HybridBinarizer,
  BinaryBitmap
} = require("@zxing/library");

const { parseQRData } = require("../utils/parseQR");

async function imageToLuminance(sharpInstance, targetSize = 400) {
  const { data, info } = await sharpInstance
    .resize(targetSize, targetSize, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const luminance = new Uint8ClampedArray(info.width * info.height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // Weighted grayscale (chuẩn hơn average)
    luminance[j] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  return { luminance, width: info.width, height: info.height };
}

function buildBitmap(luminance, width, height) {
  const source = new RGBLuminanceSource(luminance, width, height);
  return new BinaryBitmap(new HybridBinarizer(source));
}

function buildReader() {
  const reader = new MultiFormatReader();
  // ✅ Dùng DecodeHintType làm key, KHÔNG phải BarcodeFormat
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  reader.setHints(hints);
  return reader;
}

async function decodeQR(path) {
  const image = sharp(path);
  const metadata = await image.metadata();
  const { width: imgWidth, height: imgHeight } = metadata;

  // Các vùng crop để thử — ưu tiên góc phải dưới, fallback toàn ảnh
  const regions = [
    {
      left: Math.round(imgWidth * 0.7),
      top: Math.round(imgHeight * 0.7),
      width: Math.round(imgWidth * 0.3),
      height: Math.round(imgHeight * 0.3),
    },
    // Mở rộng vùng crop phòng QR bị lệch
    {
      left: Math.round(imgWidth * 0.6),
      top: Math.round(imgHeight * 0.6),
      width: Math.round(imgWidth * 0.4),
      height: Math.round(imgHeight * 0.4),
    },
    // Toàn ảnh làm fallback cuối
    { left: 0, top: 0, width: imgWidth, height: imgHeight },
  ];

  const reader = buildReader();

  for (const region of regions) {
    // Thử 2 lần: ảnh gốc và ảnh đã tăng contrast
    const variants = [
      sharp(path).extract(region),
      sharp(path).extract(region).normalise().sharpen(),
    ];

    for (const variant of variants) {
      try {
        const { luminance, width, height } = await imageToLuminance(variant);
        const bitmap = buildBitmap(luminance, width, height);
        const result = reader.decode(bitmap);
        console.log("✅ ZXing QR:", result.getText());
        return parseQRData(result.getText());
      } catch (_) {
        // tiếp tục thử variant/region tiếp theo
      }
    }
  }

  console.log("❌ ZXing không đọc được:", path);
  return null;
}

async function processImages(files) {
  let results = [];

  for (let file of files) {
    const data = await decodeQR(file.path);
    if (data) results.push(data);
    fs.unlinkSync(file.path);
  }

  let indexed = results.map((item, index) => ({ ...item, originalIndex: index }));
  let sorted = [...indexed].sort((a, b) => a.time.localeCompare(b.time));

  let indexOrder = [];
  sorted.forEach((item, order) => {
    indexOrder[item.originalIndex] = { order };
  });

  return results.map((item, index) => ({
    ...item,
    order: indexOrder[index].order + 1,
  }));
}

module.exports = { processImages };