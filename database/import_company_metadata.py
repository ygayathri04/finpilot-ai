import csv
import psycopg2

CSV_FILE = "database/india_stock_metadata.csv"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "finpilot",
    "user": "finpilot",
    "password": "finpilot_dev",
}


def import_companies():
    connection = psycopg2.connect(**DB_CONFIG)

    cursor = connection.cursor()

    inserted = 0
    skipped = 0

    with open(
        CSV_FILE,
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            market = (
                row.get("market") or ""
            ).strip().upper()

            if market != "NSE":
                skipped += 1
                continue

            symbol = (
                row.get("ticker") or ""
            ).strip().upper()

            company_name = (
                row.get("name") or ""
            ).strip()

            sector = (
                row.get("sector") or ""
            ).strip()

            if not symbol:
                skipped += 1
                continue

            cursor.execute(
                """
                INSERT INTO company_metadata (
                    symbol,
                    company_name,
                    macro_sector,
                    sector,
                    industry,
                    basic_industry
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (symbol)
                DO UPDATE SET
                    company_name = EXCLUDED.company_name,
                    sector = EXCLUDED.sector,
                    last_updated = CURRENT_TIMESTAMP;
                """,
                (
                    symbol,
                    company_name,
                    None,
                    sector,
                    None,
                    None,
                ),
            )

            inserted += 1

    connection.commit()

    cursor.close()
    connection.close()

    print(
        f"Imported/updated: {inserted} NSE companies"
    )

    print(
        f"Skipped: {skipped} non-NSE or invalid rows"
    )


if __name__ == "__main__":
    import_companies()
