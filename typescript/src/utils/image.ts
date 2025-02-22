import { createCanvas, loadImage } from "canvas";
import * as fs from "fs";
import * as path from "path";

export async function addTextToImage({
  imagePath,
  text,
  outputPath,
  x = 10,
  y = 10,
  fontSize = 30,
  fontColor = "black",
  strokeColor = "white",
  strokeWidth = 3,
}: {
  imagePath: string;
  text: string;
  outputPath: string;
  x?: number;
  y?: number;
  fontSize?: number;
  fontColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}) {
  try {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    // Draw image onto canvas
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // Set font style
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = fontColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Draw text onto image
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);

    // Determine output format based on input format
    const ext = path.extname(imagePath).toLowerCase();

    let buffer;
    if (ext === ".jpg" || ext === ".jpeg") {
      buffer = canvas.toBuffer("image/jpeg", { quality: 1.0 });
    } else {
      buffer = canvas.toBuffer("image/png");
    }

    fs.writeFileSync(outputPath, buffer);
  } catch (error) {
    throw error;
  }
}
