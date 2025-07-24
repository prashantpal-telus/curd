document.addEventListener('DOMContentLoaded', () => {
    // Form elements
    const itemForm = document.getElementById('item-form');
    const titleInput = document.getElementById('title-input');
    const descriptionInput = document.getElementById('description-input');
    const categoryInput = document.getElementById('category-input');
    const dueDateInput = document.getElementById('due-date-input');
    
    // List and notification elements
    const itemList = document.getElementById('item-list');
    const notification = document.getElementById('notification');
    const categoryFilters = document.getElementById('category-filters');
    
    // Search and sort elements
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const sortOrder = document.getElementById('sort-order');
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Bulk action buttons
    const bulkComplete = document.getElementById('bulk-complete');
    const bulkDelete = document.getElementById('bulk-delete');
    
    // Pagination elements
    const prevPage = document.getElementById('prev-page');
    const nextPage = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    // State management
    let items = [];
    let currentFilter = 'all';
    let currentPage = 1;
    let itemsPerPage = 10;
    let currentCategory = null;
    let categories = new Set();

    // Show notification
    const showNotification = (message, type = 'success') => {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        setTimeout(() => {
            notification.textContent = '';
            notification.className = 'notification';
        }, 3000);
    };

    // Handle API errors
    const handleError = async (response) => {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Something went wrong');
        }
        return response;
    };

    // Fetch all items with search, filter, and pagination
    const fetchItems = async () => {
        try {
            const searchTerm = searchInput.value;
            const sortByValue = sortSelect.value;
            const sortOrderValue = sortOrder.value;
            
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
                sortBy: sortByValue,
                sortOrder: sortOrderValue
            });

            if (searchTerm) queryParams.append('search', searchTerm);
            if (currentFilter !== 'all') queryParams.append('completed', currentFilter === 'completed');
            if (currentCategory) queryParams.append('category', currentCategory);

            const response = await fetch(`/api/items?${queryParams}`);
            await handleError(response);
            const data = await response.json();
            items = data.items;
            updatePagination(data.pagination);
            renderItems();
            await updateCategories();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // Update pagination controls
    const updatePagination = (pagination) => {
        const { total, pages, currentPage: page, limit } = pagination;
        pageInfo.textContent = `Page ${page} of ${pages} (${total} items)`;
        prevPage.disabled = page <= 1;
        nextPage.disabled = page >= pages;
        currentPage = page;
        itemsPerPage = limit;
    };

    // Fetch and update category filters
    const updateCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            await handleError(response);
            const categories = await response.json();
            renderCategoryFilters(categories);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // Render category filters
    const renderCategoryFilters = (categories) => {
        categoryFilters.innerHTML = '<button class="category-filter active" data-category="">All Categories</button>';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = `category-filter${currentCategory === category ? ' active' : ''}`;
            button.textContent = category;
            button.dataset.category = category;
            categoryFilters.appendChild(button);
        });
    };

    // Render items
    const renderItems = () => {
        itemList.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = `item ${item.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <div class="checkbox-wrapper">
                    <input type="checkbox" class="item-checkbox" data-id="${item.id}">
                    <div class="item-content">
                        <div class="item-header">
                            <span class="item-title">${item.title}</span>
                            <div class="item-actions">
                                <button class="toggle-btn" data-id="${item.id}">
                                    ${item.completed ? 'Undo' : 'Complete'}
                                </button>
                                <button class="edit-btn" data-id="${item.id}">Edit</button>
                                <button class="delete-btn" data-id="${item.id}">Delete</button>
                            </div>
                        </div>
                        <p class="item-description">${item.description || ''}</p>
                        <div class="item-metadata">
                            <span>Created: ${new Date(item.createdAt).toLocaleString()}</span>
                            ${item.updatedAt ? `<span>Updated: ${new Date(item.updatedAt).toLocaleString()}</span>` : ''}
                            ${item.dueDate ? `<span>Due: ${new Date(item.dueDate).toLocaleDateString()}</span>` : ''}
                        </div>
                        ${item.category.length > 0 ? `
                            <div class="item-categories">
                                ${item.category.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            itemList.appendChild(div);
        });
    };

    // Add item
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const categories = categoryInput.value.split(',').map(cat => cat.trim()).filter(cat => cat);
        const dueDate = dueDateInput.value;

        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    title, 
                    description, 
                    category: categories,
                    dueDate
                }),
            });
            await handleError(response);
            titleInput.value = '';
            descriptionInput.value = '';
            categoryInput.value = '';
            dueDateInput.value = '';
            await fetchItems();
            showNotification('Task added successfully');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Edit item
    itemList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.getAttribute('data-id');
            const item = items.find(i => i.id === parseInt(id));
            const newTitle = prompt('Enter new title:', item.title);
            const newDescription = prompt('Enter new description:', item.description);
            const newCategories = prompt('Enter categories (comma-separated):', item.category.join(','));
            const newDueDate = prompt('Enter due date (YYYY-MM-DD):', item.dueDate);

            if (newTitle !== null) {
                try {
                    const response = await fetch(`/api/items/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            title: newTitle,
                            description: newDescription,
                            category: newCategories.split(',').map(cat => cat.trim()).filter(cat => cat),
                            dueDate: newDueDate
                        }),
                    });
                    await handleError(response);
                    await fetchItems();
                    showNotification('Task updated successfully');
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            }
        }
    });

    // Toggle item completion
    itemList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('toggle-btn')) {
            const id = e.target.getAttribute('data-id');
            try {
                const response = await fetch(`/api/items/${id}/toggle`, {
                    method: 'PATCH'
                });
                await handleError(response);
                await fetchItems();
                showNotification('Task status updated');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    });

    // Delete item
    itemList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this task?')) {
                try {
                    const response = await fetch(`/api/items/${id}`, {
                        method: 'DELETE',
                    });
                    await handleError(response);
                    await fetchItems();
                    showNotification('Task deleted successfully');
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            }
        }
    });

    // Bulk delete
    bulkDelete.addEventListener('click', async () => {
        const selectedIds = Array.from(document.querySelectorAll('.item-checkbox:checked'))
            .map(checkbox => parseInt(checkbox.dataset.id));

        if (selectedIds.length === 0) {
            showNotification('No items selected', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
            try {
                const response = await fetch('/api/items/bulk-delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ids: selectedIds }),
                });
                await handleError(response);
                await fetchItems();
                showNotification('Items deleted successfully');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    });

    // Bulk complete
    bulkComplete.addEventListener('click', async () => {
        const selectedIds = Array.from(document.querySelectorAll('.item-checkbox:checked'))
            .map(checkbox => parseInt(checkbox.dataset.id));

        if (selectedIds.length === 0) {
            showNotification('No items selected', 'error');
            return;
        }

        try {
            const response = await fetch('/api/items/bulk-toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    ids: selectedIds,
                    completed: true
                }),
            });
            await handleError(response);
            await fetchItems();
            showNotification('Items updated successfully');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Filter event listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.id.replace('-filter', '');
            currentPage = 1;
            fetchItems();
        });
    });

    // Category filter event listener
    categoryFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-filter')) {
            document.querySelectorAll('.category-filter').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            currentPage = 1;
            fetchItems();
        }
    });

    // Search input event listener
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            fetchItems();
        }, 300);
    });

    // Sort event listeners
    sortSelect.addEventListener('change', () => fetchItems());
    sortOrder.addEventListener('change', () => fetchItems());

    // Pagination event listeners
    prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchItems();
        }
    });

    nextPage.addEventListener('click', () => {
        currentPage++;
        fetchItems();
    });

    // Initial fetch
    fetchItems();
});
