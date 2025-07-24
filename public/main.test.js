/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const fetchMock = require('jest-fetch-mock');

// Mock fetch globally
fetchMock.enableMocks();

// Load HTML content
document.documentElement.innerHTML = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

// Load the main.js script
require('./main.js');

describe('Frontend CRUD Operations', () => {
    let itemForm;
    let titleInput;
    let descriptionInput;
    let itemList;
    let notification;

    beforeEach(() => {
        // Reset fetch mocks
        fetchMock.resetMocks();
        
        // Reset DOM
        document.body.innerHTML = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
        
        // Get DOM elements
        itemForm = document.getElementById('item-form');
        titleInput = document.getElementById('title-input');
        descriptionInput = document.getElementById('description-input');
        itemList = document.getElementById('item-list');
        notification = document.getElementById('notification');

        // Trigger DOMContentLoaded
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
    });

    describe('Initial Load', () => {
        test('should fetch and display items on page load', async () => {
            const mockItems = [
                {
                    id: 1,
                    title: 'Test Item 1',
                    description: 'Description 1',
                    completed: false,
                    createdAt: new Date().toISOString()
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockItems));

            // Wait for initial fetch to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(fetchMock).toHaveBeenCalledWith('/api/items');
            expect(itemList.innerHTML).toContain('Test Item 1');
            expect(itemList.innerHTML).toContain('Description 1');
        });
    });

    describe('Create Item', () => {
        test('should add new item when form is submitted', async () => {
            const newItem = {
                id: 1,
                title: 'New Task',
                description: 'Task Description',
                completed: false,
                createdAt: new Date().toISOString()
            };

            fetchMock.mockResponseOnce(JSON.stringify(newItem));

            // Fill form
            titleInput.value = 'New Task';
            descriptionInput.value = 'Task Description';

            // Submit form
            itemForm.dispatchEvent(new Event('submit'));

            // Wait for fetch to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(fetchMock).toHaveBeenCalledWith('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: 'New Task',
                    description: 'Task Description'
                }),
            });

            // Check if form was reset
            expect(titleInput.value).toBe('');
            expect(descriptionInput.value).toBe('');
        });

        test('should show error notification when creation fails', async () => {
            fetchMock.mockRejectOnce(new Error('Failed to create item'));

            titleInput.value = 'New Task';
            itemForm.dispatchEvent(new Event('submit'));

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(notification.textContent).toContain('Failed to create item');
            expect(notification.className).toContain('error');
        });
    });

    describe('Filter Items', () => {
        test('should filter completed items', async () => {
            const mockItems = [
                { id: 1, title: 'Task 1', completed: true },
                { id: 2, title: 'Task 2', completed: false }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockItems));

            // Wait for initial fetch
            await new Promise(resolve => setTimeout(resolve, 0));

            // Click completed filter
            document.getElementById('completed-filter').click();

            expect(itemList.innerHTML).toContain('Task 1');
            expect(itemList.innerHTML).not.toContain('Task 2');
        });

        test('should filter active items', async () => {
            const mockItems = [
                { id: 1, title: 'Task 1', completed: true },
                { id: 2, title: 'Task 2', completed: false }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockItems));

            // Wait for initial fetch
            await new Promise(resolve => setTimeout(resolve, 0));

            // Click active filter
            document.getElementById('active-filter').click();

            expect(itemList.innerHTML).not.toContain('Task 1');
            expect(itemList.innerHTML).toContain('Task 2');
        });
    });

    describe('Toggle Item', () => {
        test('should toggle item completion status', async () => {
            const mockItem = {
                id: 1,
                title: 'Test Item',
                completed: false,
                createdAt: new Date().toISOString()
            };

            // Mock initial fetch
            fetchMock.mockResponseOnce(JSON.stringify([mockItem]));

            // Wait for initial fetch
            await new Promise(resolve => setTimeout(resolve, 0));

            // Mock toggle response
            fetchMock.mockResponseOnce(JSON.stringify({
                ...mockItem,
                completed: true
            }));

            // Find and click toggle button
            const toggleBtn = document.querySelector('.toggle-btn');
            toggleBtn.click();

            // Wait for toggle fetch
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(fetchMock).toHaveBeenCalledWith('/api/items/1/toggle', {
                method: 'PATCH'
            });
        });
    });

    describe('Delete Item', () => {
        test('should delete item when confirmed', async () => {
            const mockItem = {
                id: 1,
                title: 'Test Item',
                completed: false,
                createdAt: new Date().toISOString()
            };

            // Mock initial fetch
            fetchMock.mockResponseOnce(JSON.stringify([mockItem]));

            // Wait for initial fetch
            await new Promise(resolve => setTimeout(resolve, 0));

            // Mock delete response
            fetchMock.mockResponseOnce('', { status: 204 });

            // Mock confirm dialog
            window.confirm = jest.fn(() => true);

            // Find and click delete button
            const deleteBtn = document.querySelector('.delete-btn');
            deleteBtn.click();

            // Wait for delete fetch
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(fetchMock).toHaveBeenCalledWith('/api/items/1', {
                method: 'DELETE'
            });
            expect(window.confirm).toHaveBeenCalled();
        });

        test('should not delete item when not confirmed', async () => {
            const mockItem = {
                id: 1,
                title: 'Test Item',
                completed: false,
                createdAt: new Date().toISOString()
            };

            // Mock initial fetch
            fetchMock.mockResponseOnce(JSON.stringify([mockItem]));

            // Wait for initial fetch
            await new Promise(resolve => setTimeout(resolve, 0));

            // Mock confirm dialog to return false
            window.confirm = jest.fn(() => false);

            // Find and click delete button
            const deleteBtn = document.querySelector('.delete-btn');
            deleteBtn.click();

            expect(fetchMock).toHaveBeenCalledTimes(1); // Only initial fetch
            expect(window.confirm).toHaveBeenCalled();
        });
    });
});
