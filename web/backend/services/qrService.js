const fs = require("fs");
const sharp = require("sharp");
const {
  MultiFormatReader,
  BarcodeFormat,
  RGBLuminanceSource,
  HybridBinarizer,
  BinaryBitmap
} = require("@zxing/library");

const { parseQRData } = require("../utils/parseQR");

async function decodeQR(path) {
  const image = sharp(path);
  const metadata = await image.metadata();

  const imgWidth = metadata.width;
  const imgHeight = metadata.height;

  // 👉 crop vùng QR
  const cropped = image.extract({
    left: Math.round(imgWidth * 0.7),
    top: Math.round(imgHeight * 0.7),
    width: Math.round(imgWidth * 0.3),
    height: Math.round(imgHeight * 0.3)
  });

  // 👉 debug
  await cropped.toFile("debug.png");

  // 👉 lấy raw RGBA
  const { data, info } = await cropped
    .resize(400)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 👉 ZXing cần grayscale → convert
  const luminance = new Uint8ClampedArray(info.width * info.height);

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // convert RGB → grayscale
    luminance[j] = (r + g + b) / 3;
  }

  const source = new RGBLuminanceSource(
    luminance,
    info.width,
    info.height
  );

  const bitmap = new BinaryBitmap(new HybridBinarizer(source));

  const reader = new MultiFormatReader();

  try {
    reader.setHints(new Map([
        [BarcodeFormat.QR_CODE, true]
    ]));

    const result = reader.decode(bitmap);

    console.log("✅ ZXing QR:", result.getText());

    return parseQRData(result.getText());
  } catch (err) {
    console.log("❌ ZXing không đọc được:", path);
    return null;
  }
}

async function processImages(files) {
  let results = [];

  for (let file of files) {
    const data = await decodeQR(file.path);

    if (data) results.push(data);

    fs.unlinkSync(file.path); // xóa file tạm
  }

  let indexed = results.map((item, index) => ({
    ...item,
    originalIndex: index
  }));
  
  // sort theo time
  let sorted = [...indexed].sort((a, b) => a.time.localeCompare(b.time));
  
  // tạo indexOrder
  let indexOrder = [];
  sorted.forEach((item, order) => {
    indexOrder[item.originalIndex] = { order };
  });

  // thêm order
  return results.map((item, index) => ({
    ...item,
    order: indexOrder[index].order + 1
  }));
}

module.exports = { processImages };