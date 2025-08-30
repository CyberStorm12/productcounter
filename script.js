class ProductCounter {
    constructor() {
        this.products = this.loadFromStorage();
        this.archivedProducts = this.loadArchivedFromStorage();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderProducts();
    }

    bindEvents() {
        const addBtn = document.getElementById("addProductBtn");
        const productNameInput = document.getElementById("productNameInput");
        const productPriceInput = document.getElementById("productPriceInput");
        const viewArchiveBtn = document.getElementById("viewArchiveBtn");
        const businessInfoBtn = document.getElementById("businessInfoBtn");

        addBtn.addEventListener("click", () => this.addProduct());
        productNameInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.addProduct();
            }
        });
        productPriceInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.addProduct();
            }
        });
        viewArchiveBtn.addEventListener("click", () => this.viewArchive());
        businessInfoBtn.addEventListener("click", () => this.viewBusinessInfo());
    }

    addProduct() {
        const productNameInput = document.getElementById("productNameInput");
        const productPriceInput = document.getElementById("productPriceInput");
        const productName = productNameInput.value.trim();
        const productPrice = parseFloat(productPriceInput.value);

        if (!productName) {
            alert("Please enter a product name");
            return;
        }

        if (isNaN(productPrice) || productPrice < 0) {
            alert("Please enter a valid price");
            return;
        }

        // Check if product already exists
        if (this.products.find(p => p.name.toLowerCase() === productName.toLowerCase())) {
            alert("Product already exists");
            return;
        }

        const newProduct = {
            id: Date.now(),
            name: productName,
            count: 0,
            note: "",
            price: productPrice,
            photo: null,
            customerEntries: []
        };

        this.products.push(newProduct);
        this.saveToStorage();
        this.renderProducts();
        productNameInput.value = "";
        productPriceInput.value = "";
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.saveToStorage();
        this.renderProducts();
    }

    archiveProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            this.archivedProducts.push(product);
            this.products = this.products.filter(p => p.id !== id);
            this.saveToStorage();
            this.saveArchivedToStorage();
            this.renderProducts();
        }
    }

    updateCount(id, newCount) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.count = Math.max(0, newCount);
            this.saveToStorage();
            this.renderProducts();
        }
    }

    updateNote(id, note) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.note = note;
            this.saveToStorage();
        }
    }

    openProductDetail(id) {
        window.location.href = `product-detail.html?id=${id}`;
    }

    viewArchive() {
        window.location.href = "archive.html";
    }

    viewBusinessInfo() {
        window.location.href = "business-info.html";
    }

    renderProducts() {
        const container = document.getElementById("productsList");
        
        if (this.products.length === 0) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = this.products.map(product => `
            <div class="product-item">
                <div class="product-header">
                    ${product.photo ? `<img src="${product.photo}" alt="Product Photo" class="product-item-photo">` : ''}
                    <span class="product-name" onclick="app.openProductDetail(${product.id})" style="cursor: pointer;">${this.escapeHtml(product.name)}</span>
                    <input 
                        type="text" 
                        class="product-note" 
                        value="${this.escapeHtml(product.note)}"
                        placeholder="Note"
                        onchange="app.updateNote(${product.id}, this.value)"
                    >
                </div>
                <div class="counter-section">
                    <div class="counter-controls">
                        <button class="counter-btn minus" onclick="app.updateCount(${product.id}, ${product.count - 1})">−</button>
                        <span class="counter-display">${product.count}</span>
                        <button class="counter-btn plus" onclick="app.updateCount(${product.id}, ${product.count + 1})">+</button>
                    </div>
                    <div class="product-actions">
                        <button class="archive-btn" onclick="app.archiveProduct(${product.id})">Archive</button>
                        <button class="delete-btn" onclick="app.deleteProduct(${product.id})">Delete</button>
                    </div>
                    <input 
                        type="number" 
                        class="counter-input" 
                        value="${product.count}"
                        min="0"
                        onchange="app.updateCount(${product.id}, parseInt(this.value) || 0)"
                    >
                </div>

            </div>
        `).join("");
    }

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    saveToStorage() {
        localStorage.setItem("productCounterData", JSON.stringify(this.products));
    }

    loadFromStorage() {
        const data = localStorage.getItem("productCounterData");
        return data ? JSON.parse(data) : [];
    }

    saveArchivedToStorage() {
        localStorage.setItem("archivedProductsData", JSON.stringify(this.archivedProducts));
    }

    loadArchivedFromStorage() {
        const data = localStorage.getItem("archivedProductsData");
        return data ? JSON.parse(data) : [];
    }
}

// Initialize the app
const app = new ProductCounter();

