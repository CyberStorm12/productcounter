console.log("bulk-states.js loaded!");

class BulkStatesManager {
    constructor() {
        this.allCustomerEntries = [];
        this.customerStates = [];
        this.currentFilterState = null;
        this.init();
    }

    init() {
        console.log("Initializing BulkStatesManager...");
        this.loadAllCustomerEntries();
        this.loadCustomerStates();
        this.renderStatesOverview();
        this.renderCustomerEntries();
        this.bindEvents();
    }

    loadAllCustomerEntries() {
        const products = JSON.parse(localStorage.getItem("productCounterData") || "[]");
        console.log("Loaded products:", products);
        this.allCustomerEntries = [];
        products.forEach(product => {
            if (product.customerEntries) {
                product.customerEntries.forEach(entry => {
                    this.allCustomerEntries.push({
                        ...entry,
                        productName: product.name,
                        productId: product.id
                    });
                });
            }
        });
        console.log("All customer entries:", this.allCustomerEntries);
    }

    loadCustomerStates() {
        const businessInfo = JSON.parse(localStorage.getItem("businessInfo") || "{}");
        this.customerStates = businessInfo.states || [
            { name: "Pending", color: "#FFD700" },
            { name: "Processing", color: "#1E90FF" },
            { name: "Ready", color: "#32CD32" },
            { name: "Delivered", color: "#808080" }
        ];
    }

    getStateColor(stateName) {
        const state = this.customerStates.find(s => s.name === stateName);
        return state ? state.color : "#000000"; // Default to black if not found
    }

    renderStatesOverview() {
        const statesOverviewContainer = document.getElementById("statesOverview");
        statesOverviewContainer.innerHTML = "";

        const stateCounts = {};
        this.allCustomerEntries.forEach(entry => {
            stateCounts[entry.state] = (stateCounts[entry.state] || 0) + 1;
        });

        // Add an "All States" card
        const allStatesCard = document.createElement("div");
        allStatesCard.classList.add("state-card");
        allStatesCard.innerHTML = `
            <h3>All States</h3>
            <p>${this.allCustomerEntries.length}</p>
        `;
        allStatesCard.addEventListener("click", () => this.filterByState(null));
        statesOverviewContainer.appendChild(allStatesCard);

        // Add cards for each unique state
        this.customerStates.forEach(state => {
            const count = stateCounts[state.name] || 0;
            const stateCard = document.createElement("div");
            stateCard.classList.add("state-card");
            stateCard.style.borderColor = state.color; // Apply border color
            stateCard.innerHTML = `
                <h3>${state.name}</h3>
                <p>${count}</p>
            `;
            stateCard.addEventListener("click", () => this.filterByState(state.name));
            statesOverviewContainer.appendChild(stateCard);
        });

        this.updateActiveStateCard();
    }

    filterByState(stateName) {
        this.currentFilterState = stateName;
        this.renderCustomerEntries();
        this.updateActiveStateCard();
        document.getElementById("currentSelectedState").textContent = stateName || "All States";
    }

    updateActiveStateCard() {
        const stateCards = document.querySelectorAll(".state-card");
        stateCards.forEach(card => {
            card.classList.remove("active");
            const stateName = card.querySelector("h3").textContent;
            if ((this.currentFilterState === null && stateName === "All States") || (this.currentFilterState === stateName)) {
                card.classList.add("active");
            }
        });
    }

    renderCustomerEntries() {
        const customerListBulk = document.getElementById("customerListBulk");
        customerListBulk.innerHTML = "";

        let filteredEntries = this.allCustomerEntries;
        if (this.currentFilterState) {
            filteredEntries = this.allCustomerEntries.filter(entry => entry.state === this.currentFilterState);
        }

        if (filteredEntries.length === 0) {
            customerListBulk.innerHTML = `<div class="empty-state"><p>No customer entries found for this state.</p></div>`;
            return;
        }

        filteredEntries.forEach(entry => {
            const entryDiv = document.createElement("div");
            entryDiv.classList.add("customer-entry-bulk");
            entryDiv.innerHTML = `
                <input type="checkbox" class="select-checkbox" data-entry-id="${entry.id}">
                <span class="product-name-tag">Product: ${entry.productName}</span>
                <span class="entry-date-tag">${new Date(entry.createdAt).toLocaleDateString()}</span>
                <h4>Entry #${entry.id}</h4>
                <p>${this.escapeHtml(entry.data)}</p>
                <div class="entry-actions-bulk">
                    <button class="action-btn-bulk copy-btn-bulk" data-entry-id="${entry.id}">Copy</button>
                    <button class="action-btn-bulk print-btn-bulk" data-entry-id="${entry.id}">Print</button>
                </div>
            `;
            customerListBulk.appendChild(entryDiv);
        });

        this.bindEntryActions();
    }

    bindEvents() {
        document.getElementById("printAllBtn").addEventListener("click", () => this.printAllSelectedEntries());
        document.querySelector(".back-btn").addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }

    bindEntryActions() {
        document.querySelectorAll(".copy-btn-bulk").forEach(button => {
            button.addEventListener("click", (e) => this.copyCustomerEntry(e.target.dataset.entryId));
        });
        document.querySelectorAll(".print-btn-bulk").forEach(button => {
            button.addEventListener("click", (e) => this.printCustomerEntry(e.target.dataset.entryId));
        });
    }

    async copyCustomerEntry(entryId) {
        const entry = this.allCustomerEntries.find(e => e.id == entryId);
        if (!entry) return;
        try {
            await navigator.clipboard.writeText(entry.data);
            alert("Copied to clipboard!");
        } catch (err) {
            alert("Could not copy data.");
        }
    }

    printCustomerEntry(entryId) {
        const entry = this.allCustomerEntries.find(e => e.id == entryId);
        if (!entry) return;

        const businessInfo = JSON.parse(localStorage.getItem("businessInfo") || "{}");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFont("helvetica");
        doc.setTextColor(45, 55, 72);

        let yPosition = 20;
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFillColor(237, 242, 247);
        doc.rect(0, 0, pageWidth, 60, "F");

        if (businessInfo.logo) {
            try {
                doc.addImage(businessInfo.logo, "JPEG", margin, 15, 30, 30);
            } catch (error) {
                console.log("Could not add logo to PDF");
            }
        }

        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(businessInfo.name || "Your Business Name", pageWidth - margin, 25, { align: "right" });

        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.text("CUSTOMER ENTRY DETAILS", pageWidth - margin, 40, { align: "right" });

        yPosition = 70;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Product Details:", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Product Name: ${entry.productName}`, margin, yPosition);
        yPosition += 7;
        doc.text(`State: ${entry.state}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Entry Date: ${new Date(entry.createdAt).toLocaleDateString()}`, margin, yPosition);
        yPosition += 15;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Customer Information:", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const customerLines = doc.splitTextToSize(entry.data, pageWidth - 2 * margin);
        customerLines.forEach(line => {
            if (yPosition > doc.internal.pageSize.getHeight() - 50) {
                doc.addPage();
                yPosition = margin + 60;
            }
            doc.text(line, margin, yPosition);
            yPosition += 7;
        });
        yPosition += 15;

        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Amount: ${entry.productPrice ? (parseFloat(entry.productPrice) * 1).toFixed(2) : 'N/A'} BDT`, pageWidth - margin, yPosition, { align: "right" });
        yPosition += 20;

        doc.setFillColor(237, 242, 247);
        doc.rect(0, doc.internal.pageSize.getHeight() - 40, pageWidth, 40, "F");

        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(113, 128, 150);

        if (businessInfo.footerNote) {
            const footerLines = doc.splitTextToSize(businessInfo.footerNote, pageWidth - 2 * margin);
            let footerY = doc.internal.pageSize.getHeight() - 30;
            footerLines.forEach(line => {
                doc.text(line, pageWidth / 2, footerY, { align: "center" });
                footerY += 5;
            });
        } else {
            doc.text("Thank you for your business!", pageWidth / 2, doc.internal.pageSize.getHeight() - 25, { align: "center" });
        }

        const fileName = `customer_entry_${entry.id}.pdf`;
        doc.save(fileName);
    }

    printAllSelectedEntries() {
        const selectedCheckboxes = Array.from(document.querySelectorAll(".select-checkbox:checked"));
        let entriesToPrint = [];

        if (selectedCheckboxes.length > 0) {
            // If any checkboxes are selected, print only those entries
            entriesToPrint = selectedCheckboxes.map(checkbox => this.allCustomerEntries.find(entry => entry.id == checkbox.dataset.entryId));
        } else {
            // If no checkboxes are selected, print all filtered entries for the current state
            entriesToPrint = this.allCustomerEntries;
            if (this.currentFilterState) {
                entriesToPrint = this.allCustomerEntries.filter(entry => entry.state === this.currentFilterState);
            }
        }

        if (entriesToPrint.length === 0) {
            alert("No customer entries to print.");
            return;
        }

        const businessInfo = JSON.parse(localStorage.getItem("businessInfo") || "{}");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFont("helvetica");
        doc.setTextColor(45, 55, 72);

        let yPosition = 20;
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFillColor(237, 242, 247);
        doc.rect(0, 0, pageWidth, 60, "F");

        if (businessInfo.logo) {
            try {
                doc.addImage(businessInfo.logo, "JPEG", margin, 15, 30, 30);
            } catch (error) {
                console.log("Could not add logo to PDF");
            }
        }

        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(businessInfo.name || "Your Business Name", pageWidth - margin, 25, { align: "right" });

        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.text(`BULK PRINT - ${this.currentFilterState || "All States"} Customers`, pageWidth - margin, 40, { align: "right" });

        yPosition = 70;

        entriesToPrint.forEach((entry, index) => {
            if (yPosition + 100 > pageHeight) { // Estimate space needed for an entry
                doc.addPage();
                yPosition = margin + 60;
                doc.setFillColor(237, 242, 247);
                doc.rect(0, 0, pageWidth, 60, "F");
                if (businessInfo.logo) {
                    try {
                        doc.addImage(businessInfo.logo, "JPEG", margin, 15, 30, 30);
                    } catch (error) {
                        console.log("Could not add logo to PDF");
                    }
                }
                doc.setFontSize(24);
                doc.setFont("helvetica", "bold");
                doc.text(businessInfo.name || "Your Business Name", pageWidth - margin, 25, { align: "right" });
                doc.setFontSize(18);
                doc.setFont("helvetica", "normal");
                doc.text(`BULK PRINT - ${this.currentFilterState || "All States"} Customers`, pageWidth - margin, 40, { align: "right" });
            }

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`Entry ${index + 1} - Product: ${entry.productName}`, margin, yPosition);
            yPosition += 10;

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`State: ${entry.state}`, margin, yPosition);
            yPosition += 7;
            doc.text(`Entry Date: ${new Date(entry.createdAt).toLocaleDateString()}`, margin, yPosition);
            yPosition += 7;

            doc.setFontSize(12);
            const customerLines = doc.splitTextToSize(entry.data, pageWidth - 2 * margin);
            customerLines.forEach(line => {
                if (yPosition > pageHeight - 50) {
                    doc.addPage();
                    yPosition = margin + 60;
                }
                doc.text(line, margin, yPosition);
                yPosition += 7;
            });
            yPosition += 10;
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;
        });

        doc.setFillColor(237, 242, 247);
        doc.rect(0, pageHeight - 40, pageWidth, 40, "F");

        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(113, 128, 150);

        if (businessInfo.footerNote) {
            const footerLines = doc.splitTextToSize(businessInfo.footerNote, pageWidth - 2 * margin);
            let footerY = pageHeight - 30;
            footerLines.forEach(line => {
                doc.text(line, pageWidth / 2, footerY, { align: "center" });
                footerY += 5;
            });
        } else {
            doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 25, { align: "center" });
        }

        const fileName = `bulk_customer_entries_${this.currentFilterState || "All_States"}.pdf`;
        doc.save(fileName);
    }

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the manager when the page loads
document.addEventListener("DOMContentLoaded", () => {
    new BulkStatesManager();
});


