const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory database
let items = [];

// Validation middleware
const validateItem = (req, res, next) => {
    const { title, description, category, dueDate } = req.body;

    if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' });
    }

    if (title.trim().length > 100) {
        return res.status(400).json({ error: 'Title must be less than 100 characters' });
    }

    if (description && description.trim().length > 500) {
        return res.status(400).json({ error: 'Description must be less than 500 characters' });
    }

    if (category && !Array.isArray(category)) {
        return res.status(400).json({ error: 'Categories must be an array' });
    }

    if (dueDate && isNaN(Date.parse(dueDate))) {
        return res.status(400).json({ error: 'Invalid due date format' });
    }

    next();
};

// Create
app.post('/api/items', validateItem, (req, res) => {
    try {
        const item = {
            id: Date.now(),
            title: req.body.title.trim(),
            description: req.body.description ? req.body.description.trim() : '',
            category: req.body.category || [],
            dueDate: req.body.dueDate || null,
            createdAt: new Date().toISOString(),
            completed: false
        };
        items.push(item);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Read (all) with search, filter, and pagination
app.get('/api/items', (req, res) => {
    try {
        let result = [...items];
        const {
            search,
            completed,
            category,
            dueBefore,
            dueAfter,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Search
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(searchLower) ||
                item.description.toLowerCase().includes(searchLower)
            );
        }

        // Filter by completion status
        if (completed !== undefined) {
            result = result.filter(item => item.completed === (completed === 'true'));
        }

        // Filter by category
        if (category) {
            result = result.filter(item => item.category.includes(category));
        }

        // Filter by due date
        if (dueBefore) {
            result = result.filter(item => item.dueDate && new Date(item.dueDate) <= new Date(dueBefore));
        }
        if (dueAfter) {
            result = result.filter(item => item.dueDate && new Date(item.dueDate) >= new Date(dueAfter));
        }

        // Sort
        result.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            return sortOrder === 'desc' ? 
                (bValue > aValue ? 1 : -1) :
                (aValue > bValue ? 1 : -1);
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = result.length;

        const paginatedResult = {
            items: result.slice(startIndex, endIndex),
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        };

        res.json(paginatedResult);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Read (single)
app.get('/api/items/:id', (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
});

// Update
app.put('/api/items/:id', validateItem, (req, res) => {
    try {
        const index = items.findIndex(i => i.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Item not found' });

        items[index] = {
            ...items[index],
            title: req.body.title.trim(),
            description: req.body.description ? req.body.description.trim() : items[index].description,
            category: req.body.category || items[index].category,
            dueDate: req.body.dueDate || items[index].dueDate,
            completed: req.body.completed !== undefined ? req.body.completed : items[index].completed,
            updatedAt: new Date().toISOString()
        };
        res.json(items[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete
app.delete('/api/items/:id', (req, res) => {
    try {
        const index = items.findIndex(i => i.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Item not found' });

        items.splice(index, 1);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Bulk delete
app.post('/api/items/bulk-delete', (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs must be an array' });
        }

        items = items.filter(item => !ids.includes(item.id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete items' });
    }
});

// Toggle completion status
app.patch('/api/items/:id/toggle', (req, res) => {
    try {
        const index = items.findIndex(i => i.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Item not found' });

        items[index].completed = !items[index].completed;
        items[index].updatedAt = new Date().toISOString();
        res.json(items[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle item status' });
    }
});

// Bulk toggle completion status
app.post('/api/items/bulk-toggle', (req, res) => {
    try {
        const { ids, completed } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs must be an array' });
        }
        if (typeof completed !== 'boolean') {
            return res.status(400).json({ error: 'Completed status must be a boolean' });
        }

        const updatedItems = [];
        items = items.map(item => {
            if (ids.includes(item.id)) {
                const updatedItem = {
                    ...item,
                    completed,
                    updatedAt: new Date().toISOString()
                };
                updatedItems.push(updatedItem);
                return updatedItem;
            }
            return item;
        });

        res.json(updatedItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle items status' });
    }
});

// Get all categories
app.get('/api/categories', (req, res) => {
    try {
        const categories = [...new Set(items.flatMap(item => item.category))];
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
