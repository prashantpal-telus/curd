document.addEventListener('DOMContentLoaded', () => {
    const itemForm = document.getElementById('item-form');
    const titleInput = document.getElementById('title-input');
    const descriptionInput = document.getElementById('description-input');
    const itemList = document.getElementById('item-list');
    const notification = document.getElementById('notification');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    let currentFilter = 'all';
    let items = [];

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

    // Fetch all items
    const fetchItems = async () => {
        try {
            const response = await fetch('/api/items');
            await handleError(response);
            items = await response.json();
            renderItems();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // Filter items
    const filterItems = () => {
        switch (currentFilter) {
            case 'active':
                return items.filter(item => !item.completed);
            case 'completed':
                return items.filter(item => item.completed);
            default:
                return items;
        }
    };

    // Render items
    const renderItems = () => {
        const filteredItems = filterItems();
        itemList.innerHTML = '';
        
        filteredItems.forEach(item => {
            const div = document.createElement('div');
            div.className = `item ${item.completed ? 'completed' : ''}`;
            div.innerHTML = `
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
                <small>Created: ${new Date(item.createdAt).toLocaleString()}</small>
                ${item.updatedAt ? `<small> | Updated: ${new Date(item.updatedAt).toLocaleString()}</small>` : ''}
            `;
            itemList.appendChild(div);
        });
    };

    // Add item
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();

        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description }),
            });
            await handleError(response);
            const newItem = await response.json();
            items.push(newItem);
            titleInput.value = '';
            descriptionInput.value = '';
            renderItems();
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
            
            if (newTitle !== null) {
                try {
                    const response = await fetch(`/api/items/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            title: newTitle,
                            description: newDescription
                        }),
                    });
                    await handleError(response);
                    const updatedItem = await response.json();
                    items = items.map(i => i.id === parseInt(id) ? updatedItem : i);
                    renderItems();
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
                const updatedItem = await response.json();
                items = items.map(i => i.id === parseInt(id) ? updatedItem : i);
                renderItems();
                showNotification(`Task marked as ${updatedItem.completed ? 'completed' : 'active'}`);
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
                    items = items.filter(i => i.id !== parseInt(id));
                    renderItems();
                    showNotification('Task deleted successfully');
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            }
        }
    });

    // Filter event listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.id.replace('-filter', '');
            renderItems();
        });
    });

    // Initial fetch
    fetchItems();
});
