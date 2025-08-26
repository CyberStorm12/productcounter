class ArchiveManager {
    constructor() {
        this.archivedProducts = this.loadArchivedFromStorage();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderArchivedProducts();
    }

    bindEvents() {
        const searchInput = document.getElementById("searchInput");
        searchInput.addEventListener("input", () => this.renderArchivedProducts());
    }

    loadArchivedFromStorage() {
        const data = localStorage.getItem("archivedProductsData");
        return data ? JSON.parse(data) : [];
    }

    saveArchivedToStorage() {
        localStorage.setItem("archivedProductsData", JSON.stringify(this.archivedProducts));
    }

    restoreProduct(id) {
        const product = this.archivedProducts.find(p => p.id === id);
        if (!product) return;

        // Move back to active products
        const activeProducts = JSON.parse(localStorage.getItem("productCounterData") || "[]");
        activeProducts.push(product);
        localStorage.setItem("productCounterData", JSON.stringify(activeProducts));

        // Remove from archived
        this.archivedProducts = this.archivedProducts.filter(p => p.id !== id);
        this.saveArchivedToStorage();
        this.renderArchivedProducts();

        // Notify the main page to re-render
        window.location.href = "index.html";
    }

    deleteProduct(id) {
        if (!confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) return;

        this.archivedProducts = this.archivedProducts.filter(p => p.id !== id);
        this.saveArchivedToStorage();
        this.renderArchivedProducts();
    }

    renderArchivedProducts() {
        const container = document.getElementById("archivedProductsList");
        const emptyState = document.getElementById("emptyState");
        const searchInput = document.getElementById("searchInput");
        const searchTerm = searchInput.value.toLowerCase();

        const filteredProducts = this.archivedProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.note.toLowerCase().includes(searchTerm) ||
            (product.customerEntries && product.customerEntries.some(entry => entry.data.toLowerCase().includes(searchTerm)))
        );
        
        if (filteredProducts.length === 0) {
            container.innerHTML = "";
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";
        container.innerHTML = filteredProducts.map(product => `
            <div class="product-item">
                <div class="product-header">
                    <span class="product-name">${this.escapeHtml(product.name)}</span>
                    <input 
                        type="text" 
                        class="product-note" 
                        value="${this.escapeHtml(product.note || "")}"
                        readonly
                        style="background: #f7fafc; cursor: not-allowed;"
                    >
                </div>
                <div class="product-actions">
                    <button class="restore-btn" onclick="archiveManager.restoreProduct(${product.id})">Restore</button>
                    <button class="delete-btn" onclick="archiveManager.deleteProduct(${product.id})">Delete</button>
                </div>
                <div class="counter-section">
                    <div class="counter-controls">
                        <button class="counter-btn minus" disabled style="opacity: 0.5; cursor: not-allowed;">−</button>
                        <span class="counter-display">${product.count || 0}</span>
                        <button class="counter-btn plus" disabled style="opacity: 0.5; cursor: not-allowed;">+</button>
                    </div>
                    <input 
                        type="number" 
                        class="counter-input" 
                        value="${product.count || 0}"
                        readonly
                        style="background: #f7fafc; cursor: not-allowed;"
                    >
                </div>
                ${product.customerEntries && product.customerEntries.length > 0 ? 
                    `<div class="archive-info">📝 ${product.customerEntries.length} customer entries</div>` : 
                    ""
                }
                ${product.photo ? 
                    `<div class="archive-info">📷 Has product photo</div>` : 
                    ""
                }
            </div>
        `).join("");
    }

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}

function goBack() {
    window.location.href = "index.html";
}

// Initialize the archive manager
const archiveManager = new ArchiveManager();

