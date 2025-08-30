class BusinessInfoManager {
    constructor() {
        this.businessInfo = this.loadBusinessInfo();
        this.init();
    }

    init() {
        this.loadFormData();
        this.bindEvents();
        this.renderStates();
    }

    loadBusinessInfo() {
        const saved = localStorage.getItem('businessInfo');
        return saved ? JSON.parse(saved) : {
            name: '',
            logo: null,
            footerNote: '',
            states: [
                { name: 'Pending', color: '#FFD700' },
                { name: 'Processing', color: '#1E90FF' },
                { name: 'Ready', color: '#32CD32' },
                { name: 'Delivered', color: '#808080' }
            ]
        };
    }

    saveBusinessInfo() {
        localStorage.setItem('businessInfo', JSON.stringify(this.businessInfo));
    }

    loadFormData() {
        document.getElementById('businessName').value = this.businessInfo.name || '';
        document.getElementById('footerNote').value = this.businessInfo.footerNote || '';
        
        if (this.businessInfo.logo) {
            this.displayLogo(this.businessInfo.logo);
        }
    }

    bindEvents() {
        document.getElementById('saveBusinessInfo').addEventListener('click', () => this.saveForm());
        document.getElementById('addStateBtn').addEventListener('click', () => this.addState());
        document.getElementById('newStateInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addState();
            }
        });
        document.getElementById('logoInput').addEventListener('change', (e) => this.handleLogoUpload(e));
        document.getElementById('removeLogo').addEventListener('click', () => this.removeLogo());
    }

    saveForm() {
        this.businessInfo.name = document.getElementById('businessName').value.trim();
        this.businessInfo.footerNote = document.getElementById('footerNote').value.trim();
        
        this.saveBusinessInfo();
        
        // Show success message
        const saveBtn = document.getElementById('saveBusinessInfo');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = '#38a169';
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 2000);
    }

    addState() {
        const input = document.getElementById("newStateInput");
        const colorInput = document.getElementById("newStateColorInput");
        const stateName = input.value.trim();
        const stateColor = colorInput.value;
        
        if (stateName && !this.businessInfo.states.some(s => s.name === stateName)) {
            this.businessInfo.states.push({ name: stateName, color: stateColor });
            this.saveBusinessInfo();
            this.renderStates();
            input.value = "";
            colorInput.value = "#000000"; // Reset color to black
        }
    }

    removeState(stateName) {
        this.businessInfo.states = this.businessInfo.states.filter(s => s.name !== stateName);
        this.saveBusinessInfo();
        this.renderStates();
    }

    renderStates() {
        const statesList = document.getElementById("statesList");
        statesList.innerHTML = "";
        
        this.businessInfo.states.forEach(state => {
            const stateItem = document.createElement("div");
            stateItem.className = "state-item";
            stateItem.innerHTML = `
                <span class="state-color-box" style="background-color: ${state.color};"></span>
                <span class="state-name">${this.escapeHtml(state.name)}</span>
                <input type="color" class="state-color-picker" value="${state.color}" onchange="businessInfo.updateStateColor(\'${this.escapeHtml(state.name)}\', this.value)">
                <button class="delete-state-btn" onclick="businessInfo.removeState(\'${this.escapeHtml(state.name)}\')">Delete</button>
            `;
            statesList.appendChild(stateItem);
        });
    }

    updateStateColor(stateName, newColor) {
        const state = this.businessInfo.states.find(s => s.name === stateName);
        if (state) {
            state.color = newColor;
            this.saveBusinessInfo();
        }
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoData = e.target.result;
                this.businessInfo.logo = logoData;
                this.displayLogo(logoData);
                this.saveBusinessInfo();
            };
            reader.readAsDataURL(file);
        }
    }

    displayLogo(logoData) {
        const logoPreview = document.getElementById('logoPreview');
        logoPreview.innerHTML = `<img src="${logoData}" alt="Business Logo">`;
        document.getElementById('removeLogo').style.display = 'block';
    }

    removeLogo() {
        this.businessInfo.logo = null;
        this.saveBusinessInfo();
        
        const logoPreview = document.getElementById('logoPreview');
        logoPreview.innerHTML = `
            <div class="logo-placeholder">
                <span>📷</span>
                <p>Upload Logo</p>
            </div>
        `;
        document.getElementById('removeLogo').style.display = 'none';
        document.getElementById('logoInput').value = '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize business info manager
const businessInfo = new BusinessInfoManager();

