// Product Dashboard - Main JavaScript File
// This file will contain all the dashboard functionality

/**
 * API Service for handling product data from external API
 */
class APIService {
    constructor() {
        this.baseURL = 'https://api.escuelajs.co/api/v1';
    }

    /**
     * Fetch all products from the API
     * @returns {Promise<Product[]>} Array of products
     * @throws {Error} When API call fails
     */
    async getAllProducts() {
        try {
            const response = await fetch(`${this.baseURL}/products`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const products = await response.json();
            
            // Validate that we received an array
            if (!Array.isArray(products)) {
                throw new Error('Invalid data format received from API');
            }
            
            return products;
        } catch (error) {
            this.handleError(error);
            throw error; // Re-throw to allow caller to handle
        }
    }

    /**
     * Handle API errors and provide user-friendly error messages
     * @param {Error} error - The error object
     */
    handleError(error) {
        let errorMessage = 'Đã xảy ra lỗi khi tải dữ liệu sản phẩm';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            // Network error or no internet connection
            errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet của bạn.';
        } else if (error.message.includes('HTTP error')) {
            // Server errors
            const status = error.message.match(/status: (\d+)/)?.[1];
            if (status >= 500) {
                errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
            } else if (status >= 400) {
                errorMessage = 'Yêu cầu không hợp lệ. Vui lòng thử lại.';
            }
        } else if (error.message.includes('Invalid data format')) {
            errorMessage = 'Dữ liệu nhận được không hợp lệ.';
        } else if (error.name === 'AbortError') {
            errorMessage = 'Yêu cầu đã bị hủy do timeout.';
        }
        
        console.error('API Error:', error);
        this.displayError(errorMessage);
    }

    /**
     * Display error message to user
     * @param {string} message - Error message to display
     */
    displayError(message) {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }

    /**
     * Clear any displayed error messages
     */
    clearError() {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
    }
}

/**
 * Search Filter for filtering products by title
 */
class SearchFilter {
    constructor() {
        this.searchTerm = '';
        this.searchInput = document.getElementById('search-input');
        this.onSearchChangeCallback = null;
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for search input
     */
    initializeEventListeners() {
        if (this.searchInput) {
            // Use input event for real-time search as user types
            this.searchInput.addEventListener('input', (event) => {
                this.searchTerm = event.target.value.trim();
                
                if (this.onSearchChangeCallback) {
                    this.onSearchChangeCallback(this.searchTerm);
                }
            });
        }
    }

    /**
     * Filter products by title based on search term
     * @param {Product[]} products - Array of products to filter
     * @param {string} term - Search term to filter by
     * @returns {Product[]} Filtered array of products
     */
    filter(products, term = this.searchTerm) {
        if (!products || !Array.isArray(products)) {
            return [];
        }

        // If no search term, return all products
        if (!term || term.length === 0) {
            return products;
        }

        // Filter products by title (case-insensitive)
        const searchTermLower = term.toLowerCase();
        
        return products.filter(product => {
            if (!product || !product.title) {
                return false;
            }
            
            return product.title.toLowerCase().includes(searchTermLower);
        });
    }

    /**
     * Set callback function to be called when search changes
     * @param {Function} callback - Function to call when search term changes
     */
    onSearchChange(callback) {
        this.onSearchChangeCallback = callback;
    }

    /**
     * Get current search term
     * @returns {string} Current search term
     */
    getSearchTerm() {
        return this.searchTerm;
    }

    /**
     * Clear search input and term
     */
    clearSearch() {
        this.searchTerm = '';
        if (this.searchInput) {
            this.searchInput.value = '';
        }
    }
}

/**
 * Table Renderer for displaying product data with alternating row styling
 */
class TableRenderer {
    constructor() {
        this.tableElement = document.getElementById('products-table');
        this.tableBodyElement = document.getElementById('products-table-body');
        this.loadingContainer = document.getElementById('loading-container');
        this.noResultsElement = document.getElementById('no-results');
    }

    /**
     * Render the complete table with products
     * @param {Product[]} products - Array of products to display
     */
    renderTable(products) {
        // Clear existing content
        this.tableBodyElement.innerHTML = '';
        
        // Hide loading and no-results messages
        this.loadingContainer.style.display = 'none';
        this.noResultsElement.style.display = 'none';
        
        if (!products || products.length === 0) {
            // Show no results message
            this.tableElement.style.display = 'none';
            this.noResultsElement.style.display = 'block';
            return;
        }
        
        // Show table and render rows
        this.tableElement.style.display = 'table';
        
        products.forEach((product, index) => {
            const row = this.renderRow(product, index);
            this.tableBodyElement.appendChild(row);
        });
        
        // Apply alternating row styles
        this.applyAlternatingRowStyles();
    }

    /**
     * Render a single table row for a product
     * @param {Product} product - Product data
     * @param {number} index - Row index for styling
     * @returns {HTMLElement} Table row element
     */
    renderRow(product, index) {
        const row = document.createElement('tr');
        
        // Add alternating row class
        row.className = index % 2 === 0 ? 'table-row-light' : 'table-row-dark';
        
        // Image cell
        const imageCell = document.createElement('td');
        imageCell.className = 'image-cell';
        
        if (product.images && product.images.length > 0) {
            const img = document.createElement('img');
            img.src = product.images[0]; // Use first image
            img.alt = product.title || 'Product image';
            img.className = 'product-image';
            
            // Handle image load errors
            img.onerror = function() {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHZpZXdCb3g9IjAgMCA3MCA3MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjRjhGOUZBIiByeD0iOCIvPgo8cGF0aCBkPSJNMjAgMjBINTBWNTBIMjBWMjBaIiBmaWxsPSIjRTlFQ0VGIi8+Cjx0ZXh0IHg9IjM1IiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNkM3NTdEIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
                this.alt = 'No image available';
                this.classList.add('placeholder-image');
            };
            
            imageCell.appendChild(img);
        } else {
            // No image placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'product-image-placeholder';
            placeholder.textContent = 'No Image';
            imageCell.appendChild(placeholder);
        }
        
        // Title cell
        const titleCell = document.createElement('td');
        titleCell.className = 'title-cell';
        titleCell.textContent = product.title || 'Untitled Product';
        
        // Price cell
        const priceCell = document.createElement('td');
        priceCell.className = 'price-cell';
        if (product.price !== undefined && product.price !== null) {
            priceCell.textContent = `$${product.price.toFixed(2)}`;
        } else {
            priceCell.textContent = 'N/A';
        }
        
        // Description cell
        const descriptionCell = document.createElement('td');
        descriptionCell.className = 'description-cell';
        if (product.description) {
            descriptionCell.textContent = product.description;
            descriptionCell.title = product.description; // Full text on hover
        } else {
            descriptionCell.textContent = 'No description available';
        }
        
        // Category cell
        const categoryCell = document.createElement('td');
        categoryCell.className = 'category-cell';
        if (product.category && product.category.name) {
            categoryCell.textContent = product.category.name;
        } else {
            categoryCell.textContent = 'Uncategorized';
        }
        
        // Append all cells to row
        row.appendChild(imageCell);
        row.appendChild(titleCell);
        row.appendChild(priceCell);
        row.appendChild(descriptionCell);
        row.appendChild(categoryCell);
        
        return row;
    }

    /**
     * Apply alternating row styles to the table
     */
    applyAlternatingRowStyles() {
        const rows = this.tableBodyElement.querySelectorAll('tr');
        
        rows.forEach((row, index) => {
            // Remove existing classes
            row.classList.remove('table-row-light', 'table-row-dark');
            
            // Apply alternating classes
            if (index % 2 === 0) {
                row.classList.add('table-row-light');
            } else {
                row.classList.add('table-row-dark');
            }
        });
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.tableElement.style.display = 'none';
        this.noResultsElement.style.display = 'none';
        this.loadingContainer.style.display = 'block';
    }

    /**
     * Show error state
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.tableElement.style.display = 'none';
        this.noResultsElement.style.display = 'none';
        this.loadingContainer.innerHTML = `<div class="error-message">${message}</div>`;
        this.loadingContainer.style.display = 'block';
    }
}

/**
 * Pagination Controller for handling page navigation and page size
 */
class PaginationController {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10; // Default page size
        this.totalItems = 0;
        this.totalPages = 0;
        
        this.paginationContainer = document.getElementById('pagination-container');
        this.paginationInfo = document.getElementById('pagination-info');
        this.paginationControls = document.getElementById('pagination-controls');
        this.pageSizeSelect = document.getElementById('page-size-select');
        
        this.onPageChangeCallback = null;
        this.onPageSizeChangeCallback = null;
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for pagination controls
     */
    initializeEventListeners() {
        if (this.pageSizeSelect) {
            this.pageSizeSelect.addEventListener('change', (event) => {
                const newPageSize = parseInt(event.target.value);
                this.changePageSize(newPageSize);
            });
        }
    }

    /**
     * Get paged data from the full dataset
     * @param {Product[]} data - Full array of products
     * @returns {Product[]} Products for current page
     */
    getPagedData(data) {
        if (!data || !Array.isArray(data)) {
            return [];
        }

        this.totalItems = data.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        // Ensure current page is valid
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }

        // Calculate start and end indices
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;

        return data.slice(startIndex, endIndex);
    }

    /**
     * Navigate to a specific page
     * @param {number} page - Page number to navigate to
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) {
            return;
        }

        this.currentPage = page;
        
        if (this.onPageChangeCallback) {
            this.onPageChangeCallback();
        }
    }

    /**
     * Change the page size
     * @param {number} size - New page size (5, 10, or 20)
     */
    changePageSize(size) {
        const validSizes = [5, 10, 20];
        if (!validSizes.includes(size)) {
            return;
        }

        this.pageSize = size;
        this.currentPage = 1; // Reset to first page when changing page size
        
        if (this.onPageSizeChangeCallback) {
            this.onPageSizeChangeCallback();
        }
    }

    /**
     * Render pagination controls
     */
    renderControls() {
        if (!this.paginationContainer || !this.paginationInfo || !this.paginationControls) {
            return;
        }

        // Hide pagination if no data or only one page
        if (this.totalItems === 0 || this.totalPages <= 1) {
            this.paginationContainer.style.display = 'none';
            return;
        }

        // Show pagination container
        this.paginationContainer.style.display = 'flex';

        // Update pagination info
        const startItem = (this.currentPage - 1) * this.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.pageSize, this.totalItems);
        
        this.paginationInfo.textContent = `Hiển thị ${startItem}-${endItem} của ${this.totalItems} sản phẩm (Trang ${this.currentPage}/${this.totalPages})`;

        // Clear existing controls
        this.paginationControls.innerHTML = '';

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-btn';
        prevButton.textContent = 'Trước';
        prevButton.disabled = this.currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.goToPage(this.currentPage - 1);
            }
        });
        this.paginationControls.appendChild(prevButton);

        // Page number buttons
        this.renderPageNumbers();

        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-btn';
        nextButton.textContent = 'Tiếp';
        nextButton.disabled = this.currentPage === this.totalPages;
        nextButton.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.goToPage(this.currentPage + 1);
            }
        });
        this.paginationControls.appendChild(nextButton);
    }

    /**
     * Render page number buttons
     */
    renderPageNumbers() {
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add first page and ellipsis if needed
        if (startPage > 1) {
            this.createPageButton(1);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                this.paginationControls.appendChild(ellipsis);
            }
        }

        // Add page number buttons
        for (let i = startPage; i <= endPage; i++) {
            this.createPageButton(i);
        }

        // Add last page and ellipsis if needed
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                this.paginationControls.appendChild(ellipsis);
            }
            this.createPageButton(this.totalPages);
        }
    }

    /**
     * Create a page number button
     * @param {number} pageNumber - Page number for the button
     */
    createPageButton(pageNumber) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-btn';
        pageButton.textContent = pageNumber.toString();
        
        if (pageNumber === this.currentPage) {
            pageButton.classList.add('active');
        }
        
        pageButton.addEventListener('click', () => {
            this.goToPage(pageNumber);
        });
        
        this.paginationControls.appendChild(pageButton);
    }

    /**
     * Set callback for page changes
     * @param {Function} callback - Function to call when page changes
     */
    onPageChange(callback) {
        this.onPageChangeCallback = callback;
    }

    /**
     * Set callback for page size changes
     * @param {Function} callback - Function to call when page size changes
     */
    onPageSizeChange(callback) {
        this.onPageSizeChangeCallback = callback;
    }

    /**
     * Get current pagination state
     * @returns {Object} Current pagination state
     */
    getPaginationState() {
        return {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            totalPages: this.totalPages,
            totalItems: this.totalItems
        };
    }
}

/**
 * Sort Controller for handling product sorting by price and name
 */
class SortController {
    constructor() {
        this.currentSort = {
            field: null, // 'price' | 'title' | null
            direction: 'asc' // 'asc' | 'desc'
        };
        
        this.sortPriceBtn = document.getElementById('sort-price-btn');
        this.sortNameBtn = document.getElementById('sort-name-btn');
        
        this.onSortChangeCallback = null;
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for sort buttons
     */
    initializeEventListeners() {
        if (this.sortPriceBtn) {
            this.sortPriceBtn.addEventListener('click', () => {
                this.toggleSort('price');
            });
        }

        if (this.sortNameBtn) {
            this.sortNameBtn.addEventListener('click', () => {
                this.toggleSort('title');
            });
        }
    }

    /**
     * Sort products by price
     * @param {Product[]} products - Array of products to sort
     * @param {string} direction - Sort direction ('asc' or 'desc')
     * @returns {Product[]} Sorted array of products
     */
    sortByPrice(products, direction = 'asc') {
        if (!products || !Array.isArray(products)) {
            return [];
        }

        return [...products].sort((a, b) => {
            const priceA = a.price || 0;
            const priceB = b.price || 0;
            
            if (direction === 'asc') {
                return priceA - priceB;
            } else {
                return priceB - priceA;
            }
        });
    }

    /**
     * Sort products by name (title) alphabetically
     * @param {Product[]} products - Array of products to sort
     * @param {string} direction - Sort direction ('asc' or 'desc')
     * @returns {Product[]} Sorted array of products
     */
    sortByName(products, direction = 'asc') {
        if (!products || !Array.isArray(products)) {
            return [];
        }

        return [...products].sort((a, b) => {
            const titleA = (a.title || '').toLowerCase();
            const titleB = (b.title || '').toLowerCase();
            
            if (direction === 'asc') {
                return titleA.localeCompare(titleB);
            } else {
                return titleB.localeCompare(titleA);
            }
        });
    }

    /**
     * Toggle sort for a specific field
     * @param {string} field - Field to sort by ('price' or 'title')
     */
    toggleSort(field) {
        if (this.currentSort.field === field) {
            // Same field - toggle direction
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Different field - set new field and default to ascending
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }

        this.updateSortButtons();

        if (this.onSortChangeCallback) {
            this.onSortChangeCallback();
        }
    }

    /**
     * Apply current sort configuration to products
     * @param {Product[]} products - Array of products to sort
     * @returns {Product[]} Sorted array of products
     */
    applySorting(products) {
        if (!this.currentSort.field) {
            return products; // No sorting applied
        }

        if (this.currentSort.field === 'price') {
            return this.sortByPrice(products, this.currentSort.direction);
        } else if (this.currentSort.field === 'title') {
            return this.sortByName(products, this.currentSort.direction);
        }

        return products;
    }

    /**
     * Update visual indicators on sort buttons
     */
    updateSortButtons() {
        // Reset all buttons
        if (this.sortPriceBtn) {
            this.sortPriceBtn.classList.remove('active');
            this.sortPriceBtn.textContent = 'Sắp xếp theo giá';
        }

        if (this.sortNameBtn) {
            this.sortNameBtn.classList.remove('active');
            this.sortNameBtn.textContent = 'Sắp xếp theo tên';
        }

        // Update active button with direction indicator
        if (this.currentSort.field === 'price' && this.sortPriceBtn) {
            this.sortPriceBtn.classList.add('active');
            const directionText = this.currentSort.direction === 'asc' ? '↑' : '↓';
            this.sortPriceBtn.textContent = `Sắp xếp theo giá ${directionText}`;
        } else if (this.currentSort.field === 'title' && this.sortNameBtn) {
            this.sortNameBtn.classList.add('active');
            const directionText = this.currentSort.direction === 'asc' ? '↑' : '↓';
            this.sortNameBtn.textContent = `Sắp xếp theo tên ${directionText}`;
        }
    }

    /**
     * Set callback for sort changes
     * @param {Function} callback - Function to call when sort changes
     */
    onSortChange(callback) {
        this.onSortChangeCallback = callback;
    }

    /**
     * Get current sort configuration
     * @returns {Object} Current sort configuration
     */
    getSortConfig() {
        return { ...this.currentSort };
    }

    /**
     * Clear current sort
     */
    clearSort() {
        this.currentSort = {
            field: null,
            direction: 'asc'
        };
        this.updateSortButtons();
    }
}

/**
 * Dashboard Controller to coordinate all components
 */
class DashboardController {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPageProducts = [];
        this.apiService = new APIService();
        this.tableRenderer = new TableRenderer();
        this.searchFilter = new SearchFilter();
        this.paginationController = new PaginationController();
        this.sortController = new SortController();
        
        this.initializeComponents();
    }

    /**
     * Initialize all dashboard components and their interactions
     */
    initializeComponents() {
        // Set up search filter callback
        this.searchFilter.onSearchChange((searchTerm) => {
            this.applyFilters();
        });

        // Set up pagination callbacks
        this.paginationController.onPageChange(() => {
            this.updateDisplay();
        });

        this.paginationController.onPageSizeChange(() => {
            this.applyFilters();
        });

        // Set up sort controller callback
        this.sortController.onSortChange(() => {
            this.applyFilters();
        });
    }

    /**
     * Initialize dashboard and load products
     */
    async init() {
        try {
            // Clear any existing errors
            this.apiService.clearError();
            
            // Show loading state
            this.tableRenderer.showLoading();
            
            // Fetch products from API
            console.log('Making API call to fetch products...');
            this.products = await this.apiService.getAllProducts();
            
            console.log('✓ API call successful');
            console.log('✓ Received', this.products.length, 'products');
            
            if (this.products.length > 0) {
                console.log('✓ First product:', this.products[0].title);
                console.log('✓ Product structure:', {
                    id: this.products[0].id,
                    title: this.products[0].title,
                    price: this.products[0].price,
                    category: this.products[0].category?.name,
                    images: this.products[0].images?.length + ' images'
                });
            }
            
            // Apply initial filters (no search term, so shows all products)
            this.applyFilters();
            
            console.log('✓ Dashboard initialized successfully with', this.products.length, 'products');
            
        } catch (error) {
            console.error('✗ Dashboard initialization failed:', error);
            this.tableRenderer.showError('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
        }
    }

    /**
     * Apply all filters and update display
     */
    applyFilters() {
        // Start with all products
        let filtered = [...this.products];
        
        // Apply search filter
        const searchTerm = this.searchFilter.getSearchTerm();
        if (searchTerm) {
            filtered = this.searchFilter.filter(filtered, searchTerm);
            console.log(`✓ Search filter applied: "${searchTerm}" - ${filtered.length} results`);
        }
        
        // Apply sorting
        filtered = this.sortController.applySorting(filtered);
        const sortConfig = this.sortController.getSortConfig();
        if (sortConfig.field) {
            console.log(`✓ Sort applied: ${sortConfig.field} ${sortConfig.direction} - ${filtered.length} products sorted`);
        }
        
        // Store filtered results
        this.filteredProducts = filtered;
        
        // Update display
        this.updateDisplay();
    }

    /**
     * Update the table display with current filtered products
     */
    updateDisplay() {
        // Get paged data from filtered products
        this.currentPageProducts = this.paginationController.getPagedData(this.filteredProducts);
        
        // Render the table with paged products
        this.tableRenderer.renderTable(this.currentPageProducts);
        
        // Update pagination controls
        this.paginationController.renderControls();
        
        // Log current state
        const searchTerm = this.searchFilter.getSearchTerm();
        const paginationState = this.paginationController.getPaginationState();
        const sortConfig = this.sortController.getSortConfig();
        
        let logMessage = `✓ Display updated: showing ${this.currentPageProducts.length} products on page ${paginationState.currentPage}/${paginationState.totalPages}`;
        
        if (searchTerm) {
            logMessage += ` for search "${searchTerm}"`;
        }
        
        if (sortConfig.field) {
            logMessage += ` sorted by ${sortConfig.field} ${sortConfig.direction}`;
        }
        
        logMessage += ` (${paginationState.totalItems} total)`;
        
        console.log(logMessage);
    }
}

// Initialize Dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard loaded, initializing components...');
    
    try {
        const dashboard = new DashboardController();
        await dashboard.init();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        
        // Show user-friendly error message
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    Không thể khởi tạo dashboard. Vui lòng tải lại trang.
                    <br><small>Chi tiết lỗi: ${error.message}</small>
                </div>
            `;
        }
    }
});