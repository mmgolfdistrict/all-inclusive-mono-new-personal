const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3001; // Changed port to 3001

app.use(express.json());

// Endpoint to serve revision data
app.get('/api/revision', (req, res) => {
    console.log('Received request for /api/revision');
    const revisionFilePath = path.join(__dirname, 'revision.json');
    
    // Read the revision file asynchronously
    fs.readFile(revisionFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read revision file:', err);
            return res.status(500).json({ error: 'Failed to read revision file' });
        }
        try {
            const revisionData = JSON.parse(data);
            res.json(revisionData);
        } catch (error) {
            console.error('Failed to parse revision file:', error);
            res.status(500).json({ error: 'Failed to parse revision file' });
        }
    });
});

// Default route
app.get('/', (req, res) => {
    res.send('Navigate to /api/revision to get the revision data.');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/api/revision`);
});
