import mysql from "mysql2/promise";

import { MangaDexManga, MangaDexMangaModel } from "@/models";
import { mongooseWrapper } from "@/utils";

mongooseWrapper(async () => {
  const limit = 100;
  let offset = 13500;

  while (true) {
    const mangas = await MangaDexMangaModel.find(
      {},
      {},
      { limit, skip: offset }
    );
    if (mangas.length === 0) {
      console.info("Done");
      return;
    }
    console.info("Offset: ", offset);
    const batchRows = mangas.map((manga) => ({
      uuid: manga._id,
      title: getViTitle(manga.toObject()),
      md_updated_at: manga.updatedAt,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await insertBatch(batchRows);

    offset += limit;

    // return;
  }
});

// Database connection pool
const pool = mysql.createPool({
  host: process.env.MARIADB_HOST!,
  user: process.env.MARIADB_USER!,
  password: process.env.MARIADB_PASSWORD!,
  database: process.env.MARIADB_DATABASE!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Define the type for batch rows
interface BatchRow {
  uuid: string;
  title: string;
  md_updated_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Function to insert batch data
async function insertBatch(rows: BatchRow[]): Promise<void> {
  if (rows.length === 0) {
    console.log("No data to insert.");
    return;
  }

  const sql = `
    INSERT IGNORE INTO series (uuid, title, md_updated_at, created_at, updated_at) 
    VALUES ${rows.map(() => "(?, ?, ?, ?, ?)").join(",")};
  `;

  // Flatten the rows array for parameterized query
  const values = rows.flatMap((row) => [
    row.uuid,
    row.title,
    row.md_updated_at,
    row.created_at,
    row.updated_at,
  ]);

  try {
    const [result] = await pool.execute(sql, values);
    console.log("Inserted/ignored rows:", (result as any).affectedRows);
  } catch (err) {
    console.error("Error inserting batch:", err);
  }
}

function getViTitle(manga: MangaDexManga) {
  return (
    manga.title.vi ||
    manga.altTitles.find((t) => t["vi"])?.["vi"] ||
    manga.title.en ||
    Object.values(manga.title)?.[0]
  );
}
