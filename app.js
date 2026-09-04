let sheets = [];
let currentProducts = [];

const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("productsTable");
const searchInput = document.getElementById("searchInput");

const productCount = document.getElementById("productCount");
const lastUpdate = document.getElementById("lastUpdate");


// -----------------------------------------
// دریافت اطلاعات
// -----------------------------------------

async function loadProducts() {

    try {

        // جلوگیری از کش شدن اطلاعات قدیمی
        const response = await fetch(
            "pipes.json?v=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("خطا در دریافت اطلاعات");
        }

        const data = await response.json();

        sheets = data.sheets || [];

        lastUpdate.textContent = data.last_update || "-";

        createCategoryMenu();

        if (sheets.length > 0) {
            showSheet(0);
        }

    } catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="20">
                    اطلاعات محصولات هنوز آماده نیست.
                </td>
            </tr>
        `;
    }
}


// -----------------------------------------
// ساخت منوی دسته‌بندی
// -----------------------------------------

function createCategoryMenu() {

    const hero = document.querySelector(".hero");

    const oldMenu = document.getElementById("categoryMenu");

    if (oldMenu) {
        oldMenu.remove();
    }

    const menu = document.createElement("div");

    menu.id = "categoryMenu";
    menu.className = "category-menu";

    // گزینه همه محصولات
    const allButton = document.createElement("button");

    allButton.textContent = "همه محصولات";
    allButton.className = "category-btn active";

    allButton.addEventListener("click", () => {

        setActiveButton(allButton);

        showAllProducts();

    });

    menu.appendChild(allButton);


    // ساخت دکمه برای هر Sheet
    sheets.forEach((sheet, index) => {

        const button = document.createElement("button");

        button.textContent = sheet.name;

        button.className = "category-btn";

        button.addEventListener("click", () => {

            setActiveButton(button);

            showSheet(index);

        });

        menu.appendChild(button);

    });


    hero.appendChild(menu);
}


// -----------------------------------------
// فعال کردن دکمه انتخاب شده
// -----------------------------------------

function setActiveButton(activeButton) {

    document
        .querySelectorAll(".category-btn")
        .forEach(button => {

            button.classList.remove("active");

        });

    activeButton.classList.add("active");
}


// -----------------------------------------
// نمایش یک Sheet
// -----------------------------------------

function showSheet(index) {

    const sheet = sheets[index];

    if (!sheet) {
        return;
    }

    currentProducts = sheet.products || [];

    renderProducts(currentProducts);

    // پاک کردن جستجوی قبلی
    searchInput.value = "";

}


// -----------------------------------------
// نمایش تمام محصولات
// -----------------------------------------

function showAllProducts() {

    currentProducts = [];

    sheets.forEach(sheet => {

        if (sheet.products) {

            currentProducts = currentProducts.concat(
                sheet.products
            );

        }

    });

    renderProducts(currentProducts);

}


// -----------------------------------------
// ساخت جدول
// -----------------------------------------

function renderProducts(items) {

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    productCount.textContent = items.length;


    if (items.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="20">
                    محصولی پیدا نشد.
                </td>
            </tr>
        `;

        return;
    }


    // پیدا کردن تمام ستون‌های موجود
    // در محصولات فعلی

    const columns = [];

    items.forEach(product => {

        Object.keys(product).forEach(key => {

            if (!columns.includes(key)) {
                columns.push(key);
            }

        });

    });


    // Header جدول

    columns.forEach(column => {

        const th = document.createElement("th");

        th.textContent = column;

        tableHead.appendChild(th);

    });


    // محصولات

    items.forEach(product => {

        const row = document.createElement("tr");


        columns.forEach(column => {

            const td = document.createElement("td");

            const value = product[column];


            // قیمت
            if (
                typeof value === "number" &&
                column.includes("قیمت")
            ) {

                td.textContent =
                    formatPrice(value) + " تومان";

                td.classList.add("price");

            }

            // سایر اطلاعات
            else {

                td.textContent =
                    value !== undefined &&
                    value !== null
                        ? value
                        : "";

            }


            row.appendChild(td);

        });


        tableBody.appendChild(row);

    });

}


// -----------------------------------------
// فرمت قیمت
// -----------------------------------------

function formatPrice(price) {

    return new Intl.NumberFormat("fa-IR").format(
        price
    );

}


// -----------------------------------------
// جستجو
// -----------------------------------------

searchInput.addEventListener(
    "input",
    function () {

        const query =
            this.value.trim().toLowerCase();


        if (!query) {

            renderProducts(currentProducts);

            return;

        }


        const filtered =
            currentProducts.filter(product => {

                return Object.values(product)
                    .join(" ")
                    .toLowerCase()
                    .includes(query);

            });


        renderProducts(filtered);

    }
);


// -----------------------------------------
// شروع برنامه
// -----------------------------------------

loadProducts();
