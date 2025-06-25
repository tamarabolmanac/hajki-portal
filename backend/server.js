const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock data - replace this with your actual database
const routes = [
  {
    id: 1,
    title: "Mountain Trail",
    description: "A beautiful hike through the mountains with stunning views.",
    duration: 4,
    difficulty: "medium",
    distance: 12.5,
    startingPoint: "Mountain Base",
    endingPoint: "Mountain Peak",
    bestTime: "Spring and Summer"
  },
  {
    id: 2,
    title: "Forest Path",
    description: "A peaceful walk through the forest with many wildlife sightings.",
    duration: 3,
    difficulty: "easy",
    distance: 8.2,
    startingPoint: "Forest Entrance",
    endingPoint: "Clearing",
    bestTime: "All year"
  }
];

// Get all routes
app.get('/routes', (req, res) => {
  res.json({ data: routes });
});

// Get single route by ID
app.get('/routes/:id', (req, res) => {
  const route = routes.find(r => r.id === parseInt(req.params.id));
  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.json({ data: route });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
