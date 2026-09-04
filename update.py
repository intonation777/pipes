import pandas as pd
import json
from datetime import datetime


EXCEL_FILE = "pipes.xlsx"
JSON_FILE = "pipes.json"


# خواندن Excel
df = pd.read_excel(EXCEL_FILE)


# حذف ردیف‌های کاملاً خالی
df = df.dropna(how="all")


# تبدیل مقادیر خالی به رشته خالی
df = df.fillna("")


products = []

for _, row in df.iterrows():

    product = {
        "title": str(row["عنوان محصول"]).strip(),
        "price": row["قیمت (تومان)"],
        "weight": row["وزن (کیلوگرم)"],
        "price_per_kg": row["قیمت هر کیلوگرم (تومان)"],
        "update_date": str(row["تاریخ بروزرسانی"]).strip()
    }

    products.append(product)


# اطلاعات نهایی
data = {
    "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "products": products
}


# ساخت JSON
with open(JSON_FILE, "w", encoding="utf-8") as file:

    json.dump(
        data,
        file,
        ensure_ascii=False,
        indent=4
    )


print(f"{len(products)} products converted successfully.")
