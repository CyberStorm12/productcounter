// Global function for back button
function goBack() {
    window.location.href = 'index.html';
}

class ProductDetailManager {
    constructor() {
        this.productId = this.getProductIdFromUrl();
        this.product = this.loadProduct();
        this.currentStateFilter = '';
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
        this.loadCustomerStates();
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

    loadCustomerStates() {
        const businessInfo = JSON.parse(localStorage.getItem('businessInfo') || '{}');
        this.customerStates = businessInfo.states || ['Pending', 'Processing', 'Ready', 'Delivered'];
        
        // Populate state filter dropdown
        const stateFilter = document.getElementById('stateFilter');
        stateFilter.innerHTML = '<option value="">All States</option>';
        this.customerStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateFilter.appendChild(option);
        });

        // Add event listener for state filter
        stateFilter.addEventListener("change", (e) => {
            this.currentStateFilter = e.target.value;
            this.renderCustomerEntries();
        });
    }

    filterByState(selectedState) {
        this.currentStateFilter = selectedState;
        this.renderCustomerEntries();
    }

    getStateOptions(currentState) {
        return this.customerStates.map(state => 
            `<option value="${state}" ${state === currentState ? 'selected' : ''}>${state}</option>`
        ).join('');
    }

    bindEvents() {
        const photoPlaceholder = document.getElementById("photoPlaceholder");
        const productPhoto = document.getElementById("productPhoto");
        const photoInput = document.getElementById("photoInput");
        const choosePhotoBtn = document.querySelector(".choose-photo-btn");
        const addCustomerBtn = document.getElementById("addCustomerBtn");
        const customerSearchInput = document.getElementById("customerSearchInput");

        // Photo upload events
        if (photoPlaceholder) {
            photoPlaceholder.addEventListener("click", () => photoInput.click());
        }
        if (productPhoto) {
            productPhoto.addEventListener("click", () => photoInput.click());
        }
        if (choosePhotoBtn) {
            choosePhotoBtn.addEventListener("click", () => photoInput.click());
        }
        if (photoInput) {
            photoInput.addEventListener("change", (e) => this.handlePhotoUpload(e));
        }

        // Customer entry events
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener("click", () => this.addCustomerEntry());
        }
        if (customerSearchInput) {
            customerSearchInput.addEventListener("input", () => this.renderCustomerEntries());
        }
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
            state: this.customerStates[0] || 'Pending', // Default to first state
            isReady: false,
            createdAt: new Date().toISOString()
        };

        this.product.customerEntries.push(newEntry);
        this.saveProduct();
        this.renderCustomerEntries();
        this.calculateAmounts();
        
        // Clear the input box after adding entry
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
        console.log("Delete button clicked for entry: ", entryId);
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

    toggleStateFilter() {
        const stateFilter = document.getElementById("stateFilter");
        if (stateFilter.classList.contains("hidden")) {
            stateFilter.classList.remove("hidden");
        } else {
            stateFilter.classList.add("hidden");
        }
    }

    updateCustomerState(entryId, newState) {
        const entry = this.product.customerEntries.find(e => e.id === entryId);
        if (!entry) return;

        entry.state = newState;
        
        // Update isReady flag based on state
        entry.isReady = (newState === 'Ready');
        
        this.saveProduct();
        this.calculateAmounts();
    }

    toggleReadyStatus(entryId) {
        const entry = this.product.customerEntries.find(e => e.id === entryId);
        if (!entry) return;

        entry.isReady = !entry.isReady;
        
        // Update state based on isReady flag
        entry.state = entry.isReady ? 'Ready' : (this.customerStates[0] || 'Pending');
        
        this.saveProduct();
        this.renderCustomerEntries();
        this.calculateAmounts();
    }

    printCustomerEntry(entryId) {
        const entry = this.product.customerEntries.find(e => e.id === entryId);
        if (!entry) return;

        const businessInfo = JSON.parse(localStorage.getItem('businessInfo') || '{}');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Set up fonts and colors
        doc.setFont("helvetica");
        
        // Header section
        let yPosition = 20;
        
        // Business logo (if available)
        if (businessInfo.logo) {
            try {
                doc.addImage(businessInfo.logo, 'JPEG', 20, yPosition, 30, 30);
                yPosition += 35;
            } catch (error) {
                console.log('Could not add logo to PDF');
            }
        }
        
        // Business name
        if (businessInfo.name) {
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(businessInfo.name, 20, yPosition);
            yPosition += 15;
        }
        
        // Invoice title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Customer Invoice", 20, yPosition);
        yPosition += 20;
        
        // Product information
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Product: ${this.product.name}`, 20, yPosition);
        yPosition += 10;
        
        if (this.product.price) {
            doc.text(`Price: ${this.product.price} BDT`, 20, yPosition);
            yPosition += 10;
        }
        
        doc.text(`Date: ${new Date(entry.createdAt).toLocaleDateString()}`, 20, yPosition);
        yPosition += 20;
        
        // Customer data section
        doc.setFont("helvetica", "bold");
        doc.text("Customer Details:", 20, yPosition);
        yPosition += 10;
        
        doc.setFont("helvetica", "normal");
        const customerLines = entry.data.split('\n');
        customerLines.forEach(line => {
            if (yPosition > 250) { // Check if we need a new page
                doc.addPage();
                yPosition = 20;
            }
            doc.text(line, 20, yPosition);
            yPosition += 7;
        });
        
        // Footer section
        if (businessInfo.footerNote) {
            yPosition = Math.max(yPosition + 20, 270); // Ensure footer is at bottom
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            const footerLines = businessInfo.footerNote.split('\n');
            footerLines.forEach(line => {
                doc.text(line, 20, yPosition);
                yPosition += 5;
            });
        }
        
        // Save the PDF
        const fileName = `${this.product.name}_customer_${entry.id}.pdf`;
        doc.save(fileName);
    }

    renderCustomerEntries() {
        const container = document.getElementById("customerList");
        const customerSearchInput = document.getElementById("customerSearchInput");
        const searchTerm = customerSearchInput.value.toLowerCase();

        let filteredEntries = this.product.customerEntries.filter(entry => 
            entry.data.toLowerCase().includes(searchTerm)
        );

        // Apply state filter if selected
        if (this.currentStateFilter) {
            filteredEntries = filteredEntries.filter(entry => 
                entry.state === this.currentStateFilter
            );
        }
        
        if (!filteredEntries || filteredEntries.length === 0) {
            container.innerHTML = 
                `<div class="empty-state">
                    <p>${searchTerm || this.currentStateFilter ? "No matching entries found" : "No customer entries yet"}</p>
                </div>`;
            return;
        }

        container.innerHTML = filteredEntries.map((entry, index) => `
            <div class="customer-entry" data-entry-id="${entry.id}">
                <div class="customer-entry-header">
                    <div class="entry-actions">
                        <button class="action-btn entry-number-btn">Entry #${index + 1}</button>
                        <button class="action-btn edit-btn" onclick="detailManager.editCustomerEntry(${entry.id})">Edit</button>
                        <button class="action-btn copy-btn" onclick="detailManager.copyCustomerEntry(${entry.id})">Copy</button>
                        <button class="action-btn entry-btn" onclick="detailManager.entryCustomerEntry(${entry.id})">Entry</button>
                        <button class="action-btn print-btn" onclick="detailManager.printCustomerEntry(${entry.id})">Print</button>
                        <select class="action-btn state-dropdown" onchange="detailManager.updateCustomerState(${entry.id}, this.value)">
                            ${this.getStateOptions(entry.state)}
                        </select>
                    </div>
                </div>
                <div class="customer-data">${this.escapeHtml(entry.data)}</div>
                <textarea class="edit-textarea">${this.escapeHtml(entry.data)}</textarea>
                <div class="edit-actions">
                    <button class="save-btn" onclick="detailManager.saveCustomerEntry(${entry.id})">Save</button>
                    <button class="cancel-btn" onclick="detailManager.cancelEdit(${entry.id})">Cancel</button>
                    <button class="delete-btn" onclick="detailManager.deleteCustomerEntry(${entry.id})">Delete</button>
                </div>
            </div>
        `).join("");
    }

    calculateAmounts() {
        let totalAmount = 0;
        let readyAmount = 0;

        if (this.product.customerEntries && this.product.price) {
            const productPrice = parseFloat(this.product.price) || 0;
            const totalEntries = this.product.customerEntries.length;
            
            // Count entries with "Ready" state or isReady flag
            const readyEntries = this.product.customerEntries.filter(entry => 
                entry.state === 'Ready' || entry.isReady === true
            ).length;

            totalAmount = productPrice * totalEntries;
            readyAmount = productPrice * readyEntries;
        }

        const totalAmountElement = document.getElementById("totalAmount");
        const readyAmountElement = document.getElementById("readyAmount");
        
        if (totalAmountElement) {
            totalAmountElement.textContent = `${totalAmount.toFixed(2)} BDT`;
        }
        if (readyAmountElement) {
            readyAmountElement.textContent = `${readyAmount.toFixed(2)} BDT`;
        }
    }

    saveProduct() {
        const products = JSON.parse(localStorage.getItem("productCounterData") || "[]");
        const index = products.findIndex(p => p.id === this.product.id);
        if (index !== -1) {
            products[index] = this.product;
            localStorage.setItem("productCounterData", JSON.stringify(products));
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the manager when the page loads
let detailManager;
document.addEventListener("DOMContentLoaded", () => {
    detailManager = new ProductDetailManager();
});

