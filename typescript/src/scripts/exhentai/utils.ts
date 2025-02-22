import config from "@/config";
import axios from "axios";
import { load } from "cheerio";
import FormData from "form-data";
import fs from "fs";

export async function createNewGallery({
  title,
  folder,
  zipPath,
  ulcomment,
}: {
  title: string;
  folder: string;
  zipPath: string;
  ulcomment?: string;
}) {
  console.info("Uploading", title);
  const form = new FormData();

  form.append("MAX_FILE_SIZE", "1258291200");
  form.append("PHP_SESSION_UPLOAD_PROGRESS", "azvkybnszo");
  form.append("do_save", "1");
  form.append("gname_en", title);
  form.append("gname_jp", "");
  form.append("category", "2");
  form.append("langtag", "12578");
  form.append("langtype", "1");
  form.append("folderid", "");
  form.append("foldername", folder);
  form.append("ulcomment", ulcomment ?? "");
  form.append("tos", "on");

  const zipFile = fs.createReadStream(zipPath);

  form.append("files[]", zipFile, {
    filename: "file.zip",
    contentType: "application/zip",
  });

  const headers = form.getHeaders();

  try {
    const response = await axios({
      method: "POST",
      url: "https://upload.e-hentai.org/managegallery?act=new",
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
        cookie: config.EXHENTAI_COOKIE,
        Referer: "https://upload.e-hentai.org/managegallery?act=new",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        ...headers,
      },
    });
    const match = response.data.match(/ulgid=(\d+)/);
    const ulgid = match ? match[1] : null;

    console.info("Uploaded", title, ulgid);
    return { ulgid };
  } catch (error) {
    console.error("Error uploading:", error);
    throw error;
  }
}

export async function reorderGellery(params: {
  ulgid: string;
  autosort: "natural" | "lexical";
}) {
  const { data } = await axios({
    url: `https://upload.e-hentai.org/managegallery?ulgid=${params.ulgid}`,
    method: "GET",
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
      cookie: config.EXHENTAI_COOKIE,
      Referer: `https://upload.e-hentai.org/managegallery?ulgid=${params.ulgid}`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });

  const $ = load(data);

  const reorderForm = $("#reorderform");

  const pageInputs = reorderForm.find("input[name^='pagesel_']");
  const pageData = pageInputs
    .map((_, el) => {
      const name = $(el).attr("name")!;
      const value = $(el).val()!.toString();
      return { name, value };
    })
    .get();

  const formData = new URLSearchParams();
  formData.append("do_reorder", "auto");
  formData.append("autosort", params.autosort);

  pageData.forEach(({ name, value }) => {
    formData.append(name, value);
  });

  await axios({
    url: `https://upload.e-hentai.org/managegallery?ulgid=${params.ulgid}`,
    method: "POST",
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua":
        '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      cookie: config.EXHENTAI_COOKIE,
      Referer: `https://upload.e-hentai.org/managegallery?ulgid=${params.ulgid}`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    data: formData.toString(),
  });
}
