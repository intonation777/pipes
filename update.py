import pandas as pd
import json
import re
from datetime import datetime


EXCEL_FILE = "pipes.xlsx"
JSON_FILE = "pipes.json"


def clean_value(value):
    """
    تبدیل مقدار Excel به مقدار مناسب برای JSON
    """
    if pd.isna(value):
        return ""

    return str(value).strip()


def clean_price(value):
    """
    تبدیل:
    481,600 تومان  -> 481600
    112000 تومان   -> 112000
    تماس بگیرید    -> تماس بگیرید
    -              -> -
    """
    if pd.isna(value):
        return ""

    text = str(value).strip()

    if not text:
        return ""

    if "تماس" in text:
        return "تماس بگیرید"

    if text == "-":
        return "-"

    # حذف تومان، کاما و فاصله
    text = text.replace("تومان", "")
    text = text.replace(",", "")
    text = text.replace("٬", "")
    text = text.strip()

    try:
        return int(float(text))
    except ValueError:
        return text


def clean_number(value):
    """
    تبدیل وزن و اعداد اعشاری به عدد
    """
    if pd.isna(value):
        return ""

    text = str(value).strip()

    if not text:
        return ""

    text = text.replace(",", "")
    text = text.replace("٬", "")

    try:
        number = float(text)

        if number.is_integer():
            return int(number)

        return number

    except ValueError:
        return text


def clean_date(value):
    """
    نگه داشتن تاریخ شمسی به صورت متن
    """
    if pd.isna(value):
        return ""

    # اگر Excel تاریخ را به datetime تبدیل کرده باشد
    if isinstance(value, (datetime, pd.Timestamp)):
        return value.strftime("%Y/%m/%d")

    return str(value).strip()


def process_sheet(excel_file, sheet_name):
    """
    خواندن یک Sheet و تبدیل آن به ساختار JSON
    """

    df = pd.read_excel(
        excel_file,
        sheet_name=sheet_name,
        header=None
    )

    # حذف ردیف‌های کاملاً خالی
    df = df.dropna(how="all")

    if df.empty:
        return {
            "name": sheet_name,
            "products": []
        }

    # پیدا کردن ردیفی که شامل "عنوان محصول" است
    header_index = None

    for index, row in df.iterrows():

        values = [
            clean_value(value)
            for value in row.tolist()
        ]

        if any("عنوان" in value and "محصول" in value for value in values):
            header_index = index
            break

    if header_index is None:
        print(f"Header not found in sheet: {sheet_name}")

        return {
            "name": sheet_name,
            "products": []
        }

    # ستون‌ها
    headers = []

    for value in df.iloc[header_index].tolist():

        header = clean_value(value)

        if header:
            headers.append(header)

    # جلوگیری از ستون‌های تکراری
    unique_headers = []
    used = {}

    for header in headers:

        if header not in used:
            used[header] = 1
            unique_headers.append(header)

        else:
            used[header] += 1
            unique_headers.append(
                f"{header}_{used[header]}"
            )

    # داده‌ها
    data_rows = df.iloc[header_index + 1:]

    products = []

    for _, row in data_rows.iterrows():

        values = row.tolist()

        # اگر کل ردیف خالی است
        if all(pd.isna(value) for value in values):
            continue

        product = {}

        for i, header in enumerate(unique_headers):

            value = values[i] if i < len(values) else ""

            # تشخیص نوع ستون
            header_lower = header.lower()

            if "قیمت" in header:
                value = clean_price(value)

            elif "وزن" in header:
                value = clean_number(value)

            elif "تاریخ" in header:
                value = clean_date(value)

            else:
                value = clean_value(value)

            product[header] = value

        # حذف ردیف‌هایی که عنوان محصول ندارند
        title = ""

        for key in product:

            if "عنوان" in key and "محصول" in key:
                title = str(product[key]).strip()
                break

        if not title:
            continue

        products.append(product)

    return {
        "name": sheet_name,
        "products": products
    }


# -----------------------------------------
# خواندن نام Sheet ها
# -----------------------------------------

excel = pd.ExcelFile(EXCEL_FILE)

sheet_names = excel.sheet_names

print("Sheets found:")

for sheet in sheet_names:
    print("-", sheet)


# -----------------------------------------
# پردازش تمام Sheet ها
# -----------------------------------------

sheets = []

for sheet_name in sheet_names:

    print(f"\nProcessing: {sheet_name}")

    result = process_sheet(
        EXCEL_FILE,
        sheet_name
    )

    sheets.append(result)

    print(
        f"Products found: {len(result['products'])}"
    )


# -----------------------------------------
# ساخت JSON نهایی
# -----------------------------------------

data = {
    "last_update": datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    ),
    "sheets": sheets
}


with open(
    JSON_FILE,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        data,
        file,
        ensure_ascii=False,
        indent=4
    )


total_products = sum(
    len(sheet["products"])
    for sheet in sheets
)


print("\n--------------------------------")
print("Conversion completed successfully.")
print(f"Sheets: {len(sheets)}")
print(f"Total products: {total_products}")
print(f"JSON file: {JSON_FILE}")
print("--------------------------------")
