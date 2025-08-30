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
            <div class="archived-product-item">
                <div class="archived-product-header">
                    ${product.photo ? `<img src="${product.photo}" alt="Product Photo" class="archived-product-photo">` : '<div class="archived-product-placeholder">📦</div>'}
                    <div class="archived-product-info">
                        <h3 class="archived-product-name">${this.escapeHtml(product.name)}</h3>
                        <div class="archived-product-meta">
                            <span class="archived-count">Count: ${product.count || 0}</span>
                            ${product.note ? `<span class="archived-note">"${this.escapeHtml(product.note)}"</span>` : ''}
                        </div>
                        <div class="archived-product-details">
                            ${product.customerEntries && product.customerEntries.length > 0 ? 
                                `<span class="detail-badge">📝 ${product.customerEntries.length} entries</span>` : 
                                ""
                            }
                            ${product.photo ? 
                                `<span class="detail-badge">📷 Photo</span>` : 
                                ""
                            }
                            <span class="detail-badge archived-status">📦 Archived</span>
                        </div>
                    </div>
                </div>
                <div class="archived-product-actions">
                    <button class="restore-btn-new" onclick="archiveManager.restoreProduct(${product.id})">
                        <span class="btn-icon">↩️</span>
                        Restore
                    </button>
                    <button class="delete-btn-new" onclick="archiveManager.deleteProduct(${product.id})">
                        <span class="btn-icon">🗑️</span>
                        Delete
                    </button>
                </div>
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

