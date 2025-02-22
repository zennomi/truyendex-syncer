export * from "./mongoose";
export * from "./puppeteer";
export * from "./pg";
export * from "./rapidapi";
export * from "./hentag";
export * from "./axios";
export * from "./zip";
export * from "./image";
// export * from "./milvus";

export function delay(secs: number) {
  return new Promise((resolve) => setTimeout(resolve, secs * 1000));
}

export function normalizeString(str: string) {
  str = str.trim();
  // Chuyển hết sang chữ thường
  str = str.toLowerCase();

  // xóa dấu
  str = str
    .normalize("NFD") // chuyển chuỗi sang unicode tổ hợp
    .replace(/[\u0300-\u036f]/g, ""); // xóa các ký tự dấu sau khi tách tổ hợp

  // Thay ký tự đĐ
  str = str.replace(/[đĐ]/g, "d");

  // return
  return str;
}

export function removeBrackets(text: string): string {
  return text.replace(/\[.*?\]|\(.*?\)/g, "").trim();
}
