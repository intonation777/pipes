let products = [];

const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("productsTable");
const searchInput = document.getElementById("searchInput");

const productCount = document.getElementById("productCount");
const lastUpdate = document.getElementById("lastUpdate");


async function loadProducts() {

    try {

        const response = await fetch("pipes.json");

        if (!response.ok) {
            throw new Error("خطا در دریافت اطلاعات");
        }

        const data = await response.json();

        products = data.products;

        lastUpdate.textContent = data.last_update;

        createTableHeader();

        renderProducts(products);

    } catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    اطلاعات محصولات هنوز آماده نیست.
                </td>
            </tr>
        `;
    }
}


function createTableHeader() {

    tableHead.innerHTML = `
        <th>کد</th>
        <th>نوع لوله</th>
        <th>برند</th>
        <th>سایز</th>
        <th>ضخامت</th>
        <th>طول</th>
        <th>وزن</th>
        <th>قیمت</th>
    `;
}


function renderProducts(items) {

    tableBody.innerHTML = "";

    productCount.textContent = items.length;

    items.forEach(product => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${product.code}</td>
            <td>${product.type}</td>
            <td>${product.brand}</td>
            <td>${product.size}</td>
            <td>${product.thickness}</td>
            <td>${product.length}</td>
            <td>${product.weight}</td>
            <td class="price">
                ${formatPrice(product.price)}
            </td>
        `;

        tableBody.appendChild(row);

    });
}


function formatPrice(price) {

    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";

}


searchInput.addEventListener("input", function () {

    const query = this.value.trim().toLowerCase();

    const filtered = products.filter(product => {

        return Object.values(product)
            .join(" ")
            .toLowerCase()
            .includes(query);

    });

    renderProducts(filtered);

});


loadProducts();
