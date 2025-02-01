import { aggregate, readItems } from "@directus/sdk";
import { getAuthenticatedClient } from "../utils";
import { pool } from "@/utils";
const LIMIT = 500;
const main = async () => {
  const tableName = "title_variant";
  const fields = [
    "id",
    "title",
    "status",
    "source_id",
    "source",
    "name",
    "other_names",
    "image",
    "raw_data",
    "date_created",
    "date_updated",
  ];

  const client = await getAuthenticatedClient();
  const total = parseInt(
    (
      await client.request(aggregate(tableName, { aggregate: { count: "*" } }))
    )[0].count || "0"
  );

  let offset = 0;

  while (offset <= total) {
    console.info("Offset: ", offset);
    const rows = await client.request(
      readItems(tableName, {
        limit: LIMIT,
        offset,
        fields,
      })
    );

    const columnNames = fields.map((col) => `"${col}"`).join(", ");

    const updates = fields
      .map((col) => `"${col}" = EXCLUDED."${col}"`)
      .join(", ");

    const allValues: any[] = [];
    const valuePlaceholders = rows
      .map((row, rowIndex) => {
        const rowValues = fields.map((col) => {
          const value = row[col];
          if (value === null || value === undefined) {
            return null;
          }
          return typeof value === "object" ? JSON.stringify(value) : value;
        });
        allValues.push(...rowValues);
        const rowPlaceholder = fields
          .map((_, colIndex) => `$${rowIndex * fields.length + colIndex + 1}`)
          .join(", ");
        return `(${rowPlaceholder})`;
      })
      .join(", ");

    const batchQuery = `
        INSERT INTO ${tableName} (${columnNames})
        VALUES ${valuePlaceholders}
        ON CONFLICT (id) DO UPDATE SET
        ${updates};
      `;

    await pool.query(batchQuery, allValues);

    offset += LIMIT;
  }
};

main();
