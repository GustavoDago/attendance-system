import requests
import json

def fetch_holidays(year):
    url = f"https://api.argentinadatos.com/v1/feriados/{year}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching holidays: {response.status_code}")
        return []

def generate_sql(holidays):
    sql_statements = []
    # Using MERGE to avoid duplicates if the script is run multiple times
    for h in holidays:
        date = h['fecha']
        reason = h['nombre'].replace("'", "''")
        # H2 MERGE syntax
        sql = f"MERGE INTO holidays (date, reason) KEY(date) VALUES ('{date}', '{reason}');"
        sql_statements.append(sql)
    return "\n".join(sql_statements)

if __name__ == "__main__":
    year = 2026
    holidays = fetch_holidays(year)
    if holidays:
        sql = generate_sql(holidays)
        with open("holidays_2026.sql", "w", encoding="utf-8") as f:
            f.write(sql)
        print(f"Successfully generated holidays_2026.sql with {len(holidays)} holidays.")
    else:
        print("No holidays fetched.")
