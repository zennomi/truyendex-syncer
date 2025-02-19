import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const ULGID = "1425897";

async function main() {
  const form = new FormData();

  form.append("MAX_FILE_SIZE", "1258291200");
  form.append("PHP_SESSION_UPLOAD_PROGRESS", "azvkybnszo");
  form.append("do_save", "1");
  form.append("gname_en", "Title");
  form.append("gname_jp", "");
  form.append("category", "2");
  form.append("langtag", "12578");
  form.append("langtype", "1");
  form.append("folderid", "2");
  form.append("foldername", "");
  form.append("ulcomment", "");
  form.append("tos", "on");

  // Adding an empty file field
  const imagePath = path.join(__dirname, "13.jpg");
  const imageFile = fs.createReadStream(imagePath);

  form.append("files[]", imageFile, {
    filename: "13.jpg",
    contentType: "image/jpeg",
  });

  const headers = form.getHeaders();

  try {
    const response = await axios({
      method: "POST",
      url: `https://upload.e-hentai.org/managegallery?ulgid=${ULGID}`,
      data: form,
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "sec-ch-ua":
          '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie: "",
        Referer: "https://upload.e-hentai.org/managegallery?act=new",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        ...headers,
      },
    });
    const match = response.data.match(/ulgid=(\d+)/);
    const ulgid = match ? match[1] : null;

    console.log({ ulgid });
  } catch (error) {
    console.error("Error uploading:", error);
  }
}

main();
