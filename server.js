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
    const { title, description } = req.body;
    
    if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' });
    }
    
    if (title.trim().length > 100) {
        return res.status(400).json({ error: 'Title must be less than 100 characters' });
    }
    
    if (description && description.trim().length > 500) {
        return res.status(400).json({ error: 'Description must be less than 500 characters' });
    }
    
    next();
};

// Create
app.post('/api/items', (req, res) => {
    try {
        if (!req.body.title || req.body.title.trim().length === 0) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const item = {
            id: Date.now(),
            title: req.body.title.trim(),
            description: req.body.description ? req.body.description.trim() : '',
            createdAt: new Date().toISOString(),
            completed: false
        };
        items.push(item);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Read (all)
app.get('/api/items', (req, res) => {
    res.json(items);
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
