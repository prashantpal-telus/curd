const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create a new Express application for testing
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory database for testing
let items = [];

// Import routes
app.post('/api/items', (req, res) => {
    try {
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

app.get('/api/items', (req, res) => {
    res.json(items);
});

app.get('/api/items/:id', (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
});

app.put('/api/items/:id', (req, res) => {
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

// Tests
describe('CRUD API Tests', () => {
    beforeEach(() => {
        items = []; // Reset items before each test
    });

    describe('POST /api/items', () => {
        test('should create a new item', async () => {
            const response = await request(app)
                .post('/api/items')
                .send({
                    title: 'Test Item',
                    description: 'Test Description'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe('Test Item');
            expect(response.body.description).toBe('Test Description');
            expect(response.body.completed).toBe(false);
        });

        test('should return 400 if title is missing', async () => {
            const response = await request(app)
                .post('/api/items')
                .send({
                    description: 'Test Description'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/items', () => {
        test('should return all items', async () => {
            // Add test items
            await request(app)
                .post('/api/items')
                .send({ title: 'Item 1' });
            await request(app)
                .post('/api/items')
                .send({ title: 'Item 2' });

            const response = await request(app).get('/api/items');
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
        });
    });

    describe('PUT /api/items/:id', () => {
        test('should update an existing item', async () => {
            // Create an item
            const createResponse = await request(app)
                .post('/api/items')
                .send({ title: 'Original Title' });

            const updateResponse = await request(app)
                .put(`/api/items/${createResponse.body.id}`)
                .send({ title: 'Updated Title' });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.title).toBe('Updated Title');
        });

        test('should return 404 for non-existent item', async () => {
            const response = await request(app)
                .put('/api/items/999')
                .send({ title: 'Updated Title' });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/items/:id', () => {
        test('should delete an existing item', async () => {
            // Create an item
            const createResponse = await request(app)
                .post('/api/items')
                .send({ title: 'To Be Deleted' });

            const deleteResponse = await request(app)
                .delete(`/api/items/${createResponse.body.id}`);

            expect(deleteResponse.status).toBe(204);

            // Verify item is deleted
            const getResponse = await request(app)
                .get(`/api/items/${createResponse.body.id}`);
            expect(getResponse.status).toBe(404);
        });
    });

    describe('PATCH /api/items/:id/toggle', () => {
        test('should toggle item completion status', async () => {
            // Create an item
            const createResponse = await request(app)
                .post('/api/items')
                .send({ title: 'Toggle Test' });

            const toggleResponse = await request(app)
                .patch(`/api/items/${createResponse.body.id}/toggle`);

            expect(toggleResponse.status).toBe(200);
            expect(toggleResponse.body.completed).toBe(true);

            // Toggle back
            const toggleBackResponse = await request(app)
                .patch(`/api/items/${createResponse.body.id}/toggle`);

            expect(toggleBackResponse.status).toBe(200);
            expect(toggleBackResponse.body.completed).toBe(false);
        });
    });
});
