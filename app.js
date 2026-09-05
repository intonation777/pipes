let sheets = [];
let currentProducts = [];

const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("productsTable");
const searchInput = document.getElementById("searchInput");

const productCount = document.getElementById("productCount");
const lastUpdate = document.getElementById("lastUpdate");

const clearSearch = document.getElementById("clearSearch");
const resultStatus = document.getElementById("resultStatus");

const categoryMenu = document.getElementById("categoryMenu");

const themeToggle = document.getElementById("themeToggle");


// =========================================
// حالت روشن / تاریک
// =========================================

const THEME_KEY = "pipes-theme";

function getSystemTheme() {

    return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

}

function getActiveTheme() {

    const saved = localStorage.getItem(THEME_KEY);

    if (saved === "dark" || saved === "light") {
        return saved;
    }

    return getSystemTheme();

}

function applyTheme(theme) {

    document.documentElement.setAttribute("data-theme", theme);

    themeToggle.setAttribute(
        "aria-pressed",
        theme === "dark" ? "true" : "false"
    );

}

if (themeToggle) {

    applyTheme(getActiveTheme());

    themeToggle.addEventListener("click", () => {

        const next =
            getActiveTheme() === "dark" ? "light" : "dark";

        localStorage.setItem(THEME_KEY, next);

        applyTheme(next);

    });

    // اگر کاربر هیچ ترجیح دستی ثبت نکرده، تغییر حالت سیستم را دنبال کن
    if (window.matchMedia) {

        window
            .matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", () => {

                if (!localStorage.getItem(THEME_KEY)) {
                    applyTheme(getSystemTheme());
                }

            });

    }

}


// =========================================
// نرمال‌سازی متن فارسی
// =========================================

function normalizeText(value) {
    if (value === undefined || value === null) return "";

    return String(value)
        // حروف عربی → فارسی
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/ة/g, "ه")
        .replace(/ۀ/g, "ه")
        .replace(/ؤ/g, "و")
        .replace(/إ/g, "ا")
        .replace(/أ/g, "ا")

        // حذف اعراب
        .replace(/[\u064B-\u065F\u0670]/g, "")

        // اعداد فارسی → انگلیسی
        .replace(/[۰-۹]/g, digit =>
            String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
        )

        // اعداد عربی → انگلیسی
        .replace(/[٠-٩]/g, digit =>
            String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
        )

        // فاصله‌های اضافی
        .replace(/\s+/g, " ")

        .toLowerCase()
        .trim();
}


// =========================================
// دریافت اطلاعات
// =========================================

async function loadProducts() {

    try {

        const response = await fetch(
            "pipes.json?v=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("خطا در دریافت اطلاعات");
        }

        const data = await response.json();

        sheets = Array.isArray(data.sheets)
            ? data.sheets
            : [];

        lastUpdate.textContent =
            formatPersianDate(data.last_update);

        createCategoryMenu();

        if (sheets.length > 0) {

            showAllProducts();

            const firstCard =
                categoryMenu.querySelector(
                    ".category-card"
                );

            if (firstCard) {
                setActiveButton(firstCard);
            }

        } else {

            renderProducts([]);

        }

    } catch (error) {

        console.error(error);

        tableHead.innerHTML = "";

        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="20">
                    <div class="empty-state">
                        <div class="empty-icon">!</div>
                        <strong>
                            اطلاعات محصولات در دسترس نیست
                        </strong>
                        <span>
                            لطفاً دوباره صفحه را بارگذاری کنید.
                        </span>
                    </div>
                </td>
            </tr>
        `;

        productCount.textContent = "۰";
        resultStatus.textContent = "خطا در دریافت اطلاعات";

    }

}


// =========================================
// ساخت منوی دسته‌بندی
// =========================================

function createCategoryMenu() {

    if (!categoryMenu) {
        return;
    }

    categoryMenu.innerHTML = "";

    let totalProducts = 0;

    sheets.forEach(sheet => {

        totalProducts +=
            Array.isArray(sheet.products)
                ? sheet.products.length
                : 0;

    });


    // =====================================
    // همه محصولات
    // =====================================

    const allCard =
        createCategoryCard(
            "همه محصولات",
            totalProducts
        );

    allCard.classList.add("active");

    allCard.addEventListener(
        "click",
        () => {

            setActiveButton(allCard);

            showAllProducts();

        }
    );

    categoryMenu.appendChild(allCard);


    // =====================================
    // دسته‌ها
    // =====================================

    sheets.forEach((sheet, index) => {

        const count =
            Array.isArray(sheet.products)
                ? sheet.products.length
                : 0;

        const card =
            createCategoryCard(
                sheet.name || `دسته ${index + 1}`,
                count
            );

        card.addEventListener(
            "click",
            () => {

                setActiveButton(card);

                showSheet(index);

            }
        );

        categoryMenu.appendChild(card);

    });

}


// =========================================
// ساخت کارت دسته‌بندی
// =========================================

function createCategoryCard(title, count) {

    const card =
        document.createElement("button");

    card.type = "button";

    card.className = "category-card";

    card.innerHTML = `
        <span>${escapeHTML(title)}</span>
        <span class="category-count">
            ${count.toLocaleString("fa-IR")}
        </span>
    `;

    return card;

}


// =========================================
// فعال کردن دسته
// =========================================

function setActiveButton(activeButton) {

    document
        .querySelectorAll(".category-card")
        .forEach(card => {

            card.classList.remove("active");

        });

    activeButton.classList.add("active");

    activeButton.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
    });

}


// =========================================
// نمایش یک Sheet
// =========================================

function showSheet(index) {

    const sheet = sheets[index];

    if (!sheet) {
        return;
    }

    currentProducts =
        Array.isArray(sheet.products)
            ? sheet.products
            : [];

    searchInput.value = "";

    updateSearchUI();

    renderProducts(currentProducts);

}


// =========================================
// نمایش همه محصولات
// =========================================

function showAllProducts() {

    currentProducts = [];

    sheets.forEach(sheet => {

        if (Array.isArray(sheet.products)) {

            currentProducts =
                currentProducts.concat(
                    sheet.products
                );

        }

    });

    searchInput.value = "";

    updateSearchUI();

    renderProducts(currentProducts);

}


// =========================================
// ساخت جدول
// =========================================

function renderProducts(items) {

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    productCount.textContent =
        items.length.toLocaleString("fa-IR");

    resultStatus.textContent =
        `${items.length.toLocaleString("fa-IR")} محصول`;


    if (!items.length) {

        tableBody.innerHTML = `

            <tr class="empty-row">

                <td colspan="20">

                    <div class="empty-state">

                        <div class="empty-icon">
                            ⌕
                        </div>

                        <strong>
                            محصولی پیدا نشد
                        </strong>

                        <span>
                            عبارت جستجو یا دسته‌بندی دیگری را امتحان کنید.
                        </span>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    // =====================================
    // پیدا کردن ستون‌ها
    // =====================================

    const columns = [];

    items.forEach(product => {

        Object.keys(product).forEach(key => {

            if (!columns.includes(key)) {
                columns.push(key);
            }

        });

    });


    // =====================================
    // Header
    // =====================================

    columns.forEach(column => {

        const th =
            document.createElement("th");

        th.textContent = column;

        tableHead.appendChild(th);

    });


    // =====================================
    // Rows
    // =====================================

    items.forEach(product => {

        const row =
            document.createElement("tr");

        columns.forEach((column, index) => {

            const td =
                document.createElement("td");

            const value =
                product[column];


            // ---------------------------------
            // عنوان ستون برای موبایل
            // ---------------------------------

            td.dataset.label = column;


            // ---------------------------------
            // قیمت
            // ---------------------------------

            if (
                typeof value === "number" &&
                column.includes("قیمت")
            ) {

                td.textContent =
                    formatPrice(value) +
                    " تومان";

                td.classList.add("price");

            }


            // ---------------------------------
            // عددهای بزرگ
            // ---------------------------------

            else if (
                typeof value === "number"
            ) {

                td.textContent =
                    formatNumber(value);

            }


            // ---------------------------------
            // سایر اطلاعات
            // ---------------------------------

            else {

                td.textContent =
                    value !== undefined &&
                    value !== null
                        ? value
                        : "";

            }


            // اولین ستون
            if (index === 0) {
                td.classList.add("product-title-cell");
            }


            row.appendChild(td);

        });

        tableBody.appendChild(row);

    });

}


// =========================================
// فرمت قیمت
// =========================================

function formatPrice(price) {

    return new Intl.NumberFormat(
        "fa-IR"
    ).format(price);

}


// =========================================
// فرمت اعداد
// =========================================

function formatNumber(value) {

    if (
        typeof value !== "number"
    ) {
        return value;
    }

    return new Intl.NumberFormat(
        "fa-IR"
    ).format(value);

}


// =========================================
// جستجو
// =========================================

let searchDebounce = null;

searchInput.addEventListener("input", function () {

    updateSearchUI();

    clearTimeout(searchDebounce);

    searchDebounce = setTimeout(() => {

        const query = normalizeText(this.value);

        if (!query) {
            renderProducts(currentProducts);
            return;
        }

        // عبارت جستجو را به کلمات جدا می‌کنیم تا کاربر بتواند
        // چند کلمه را با هم جستجو کند، حتی اگر هرکدام در یک
        // ستون متفاوت از محصول (مثلاً نام و سایز) قرار داشته باشند.
        const queryWords = query.split(" ").filter(Boolean);

        const filtered = currentProducts.filter(product => {

            const productText = Object.values(product)
                .map(normalizeText)
                .join(" ");

            return queryWords.every(word =>
                productText.includes(word)
            );

        });

        renderProducts(filtered);

    }, 120);

});

// =========================================
// پاک کردن جستجو
// =========================================

clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        updateSearchUI();

        renderProducts(
            currentProducts
        );

        searchInput.focus();

    }
);


// =========================================
// وضعیت Search
// =========================================

function updateSearchUI() {

    if (
        searchInput.value.trim()
    ) {

        clearSearch.classList.add(
            "visible"
        );

    } else {

        clearSearch.classList.remove(
            "visible"
        );

    }

}

function formatPersianDate(dateString) {

    if (!dateString) {
        return "-";
    }

    try {

        // تبدیل فرمت:
        // 2026-09-04 15:30:00
        // به فرمت قابل پردازش JavaScript

        const normalized =
            dateString.replace(" ", "T");

        const date =
            new Date(normalized);

        if (isNaN(date.getTime())) {
            return dateString;
        }


        const formatter =
            new Intl.DateTimeFormat(
                "fa-IR-u-ca-persian",
                {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


        return formatter.format(date);

    } catch (error) {

        console.error(
            "خطا در تبدیل تاریخ:",
            error
        );

        return dateString;

    }

}

// =========================================
// جلوگیری از HTML Injection
// =========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================
// شروع
// =========================================

loadProducts();
