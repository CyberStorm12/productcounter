class ProductDetailManager {
    constructor() {
        this.productId = this.getProductIdFromUrl();
        this.product = this.loadProduct();
        this.init();
    }

    getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get("id"));
    }

    loadProduct() {
        const products = JSON.parse(localStorage.getItem("productCounterData") || "[]");
        return products.find(p => p.id === this.productId);
    }

    init() {
        if (!this.product) {
            alert("Product not found");
            window.location.href = "index.html";
            return;
        }

        this.setupPage();
        this.bindEvents();
        this.renderCustomerEntries();
        this.calculateAmounts();
    }

    setupPage() {
        document.getElementById("productTitle").textContent = this.product.name;
        
        if (this.product.photo) {
            document.getElementById("productPhoto").src = this.product.photo;
            document.getElementById("productPhoto").classList.remove("hidden");
            document.getElementById("photoPlaceholder").classList.add("hidden");
        }
    }

    bindEvents() {
        const uploadBtn = document.getElementById("uploadPhotoBtn");
        const photoInput = document.getElementById("photoInput");
        const addCustomerBtn = document.getElementById("addCustomerBtn");
        const customerInput = document.getElementById("customerDataInput");
        const customerSearchInput = document.getElementById("customerSearchInput");

        uploadBtn.addEventListener("click", () => photoInput.click());
        photoInput.addEventListener("change", (e) => this.handlePhotoUpload(e));
        addCustomerBtn.addEventListener("click", () => this.addCustomerEntry());
        customerInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && e.ctrlKey) {
                this.addCustomerEntry();
            }
        });
        customerSearchInput.addEventListener("input", () => this.renderCustomerEntries());
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("File size too large. Please choose a file under 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.product.photo = e.target.result;
            this.saveProduct();
            
            document.getElementById("productPhoto").src = e.target.result;
            document.getElementById("productPhoto").classList.remove("hidden");
            document.getElementById("photoPlaceholder").classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }

    addCustomerEntry() {
        const input = document.getElementById("customerDataInput");
        const customerData = input.value.trim();

        if (!customerData) {
            alert("Please enter customer data");
            return;
        }

        if (!this.product.customerEntries) {
            this.product.customerEntries = [];
        }

        const newEntry = {
            id: Date.now(),
            data: customerData,
            isReady: false, // New field for ready status
            createdAt: new Date().toISOString()
        };

        this.product.customerEntries.push(newEntry);
        this.saveProduct();
        this.renderCustomerEntries();
        this.calculateAmounts();
        input.value = "";
    }

    editCustomerEntry(entryId) {
        const entry = this.product.customerEntries.find(e => e.id === entryId);
        if (!entry) return;

        const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
        entryElement.classList.add("edit-mode");
        
        const textarea = entryElement.querySelector(".edit-textarea");
        textarea.value = entry.data;
        textarea.focus();
    }

    saveCustomerEntry(entryId) {
        const entry = this.product.customerEntries.find(e => e.id === entryId);
        if (!entry) return;

        const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
        const textarea = entryElement.querySelector(".edit-textarea");
        
        entry.data = textarea.value.trim();
        if (!entry.data) {
            alert("Customer data cannot be empty");
            return;
        }

        this.saveProduct();
        this.renderCustomerEntries();
        this.calculateAmounts();
    }

    cancelEdit(entryId) {
        const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
        entryElement.classList.remove("edit-mode");
    }

    deleteCustomerEntry(entryId) {
        if (!confirm("Are you sure you want to delete this customer entry?")) return;

        this.product.customerEntries = this.product.customerEntries.filter(e => e.id !== entryId);
        this.saveProduct();
        this.renderCustomerEntries();
        this.calculateAmounts();
    }

    async copyCustomerEntry(entryId) {
        const entry = this.product.customerEntries.find(e => e.id === entryId);
        if (!entry) return;

        try {
            await navigator.clipboard.writeText(entry.data);
            
            // Show feedback
            const copyBtn = document.querySelector(`[data-entry-id="${entryId}"] .copy-btn`);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            copyBtn.style.background = "#10b981";
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = "#38a169";
            }, 1000);
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = entry.data;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            
            alert("Customer data copied to clipboard!");
        }
    }

    async entryCustomerEntry(entryId) {
        const entry = this.product.customerEntries.find(e => e.id === entryId);
        if (!entry) return;

        try {
            await navigator.clipboard.writeText(entry.data);
            window.open("https://auto-pathao.qbexel.com", "_blank");
        } catch (err) {
            alert("Could not copy data or open link.");
        }
    }

    toggleReadyStatus(entryId) {
        const entry = this.product.customerEntries.find(e => e.id === entryId);
        if (!entry) return;

        entry.isReady = !entry.isReady;
        this.saveProduct();
        this.renderCustomerEntries();
        this.calculateAmounts();
    }

    renderCustomerEntries() {
        const container = document.getElementById("customerList");
        const customerSearchInput = document.getElementById("customerSearchInput");
        const searchTerm = customerSearchInput.value.toLowerCase();

        const filteredEntries = this.product.customerEntries.filter(entry => 
            entry.data.toLowerCase().includes(searchTerm)
        );
        
        if (!filteredEntries || filteredEntries.length === 0) {
            container.innerHTML = 
                `<div class="empty-state">
                    <p>${searchTerm ? "No matching entries found" : "No customer entries yet"}</p>
                </div>`;
            return;
        }

        container.innerHTML = filteredEntries.map((entry, index) => `
            <div class="customer-entry" data-entry-id="${entry.id}">
                <div class="customer-entry-header">
                    <span class="entry-number">Entry #${index + 1}</span>
                    <div class="entry-actions">
                        <button class="action-btn edit-btn" onclick="detailManager.editCustomerEntry(${entry.id})">Edit</button>
                        <button class="action-btn delete-btn" onclick="detailManager.deleteCustomerEntry(${entry.id})">Delete</button>
                        <button class="action-btn copy-btn" onclick="detailManager.copyCustomerEntry(${entry.id})">Copy</button>
                        <button class="action-btn entry-btn" onclick="detailManager.entryCustomerEntry(${entry.id})">Entry</button>
                        <button class="action-btn ready-btn ${entry.isReady ? "green" : ""}" onclick="detailManager.toggleReadyStatus(${entry.id})">Ready</button>
                    </div>
                </div>
                <div class="customer-data">${this.escapeHtml(entry.data)}</div>
                <textarea class="edit-textarea">${this.escapeHtml(entry.data)}</textarea>
                <div class="edit-actions">
                    <button class="save-btn" onclick="detailManager.saveCustomerEntry(${entry.id})">Save</button>
                    <button class="cancel-btn" onclick="detailManager.cancelEdit(${entry.id})">Cancel</button>
                </div>
            </div>
        `).join("");
    }

    calculateAmounts() {
        let totalAmount = 0;
        let readyAmount = 0;

        if (this.product.customerEntries && this.product.price) {
            const productPrice = this.product.price;
            const totalEntries = this.product.customerEntries.length;
            const readyEntries = this.product.customerEntries.filter(entry => entry.isReady).length;

            totalAmount = productPrice * totalEntries;
            readyAmount = productPrice * readyEntries;
        }

        document.getElementById("totalAmount").textContent = `${totalAmount.toFixed(2)} BDT`;
        document.getElementById("readyAmount").textContent = `${readyAmount.toFixed(2)} BDT`;
    }

    saveProduct() {
        const products = JSON.parse(localStorage.getItem("productCounterData") || "[]");
        const index = products.findIndex(p => p.id === this.productId);
        if (index !== -1) {
            products[index] = this.product;
            localStorage.setItem("productCounterData", JSON.stringify(products));
        }
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

// Initialize the detail manager
const detailManager = new ProductDetailManager();

