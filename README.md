# Cost Manager API

A RESTful API service for managing personal expenses built with Node.js, Express, and MongoDB. This API allows users to track their expenses, categorize them, and generate detailed reports.

## Features

- 💰 Create and manage cost entries
- 👥 User management system
- 📊 Generate monthly expense reports
- 📝 Expense categorization
- 🔍 Detailed cost tracking with timestamps
- 🗃️ MongoDB integration for data persistence

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- REST API architecture

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cost-manager-api.git
cd cost-manager-api
```

2. Install dependencies:
```bash
npm install
```

3. Configure MongoDB connection: (Check Security Note below!)
- Open app.js
- Update the MongoDB connection URL:
```env
const URL = "your_mongodb_connection_string";
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Cost Management

#### Add a New Cost
```http
POST /api/add
```
Request body:
```json
{
  "userid": "string",
  "description": "string",
  "category": "food|health|housing|sport|education",
  "sum": "number",
  "created_at": "date (optional)"
}
```

#### Get Monthly Report
```http
GET /api/report?id={userid}&year={year}&month={month}
```
Query parameters:
- `id`: User ID
- `year`: Report year
- `month`: Report month (1-12)

### User Management

#### Create New User
```http
POST /api/users/adduser
```
Request body:
```json
{
  "id": "string",
  "first_name": "string",
  "last_name": "string",
  "birthday": "date",
  "marital_status": "string"
}
```

#### Get User Details
```http
GET /api/users/:id
```

#### Get Developers Info
```http
GET /api/about
```

## Data Models

### Cost Model
```javascript
{
  description: String,
  category: String (enum),
  sum: Number,
  userid: String,
  created_at: Date
}
```

### User Model
```javascript
{
  id: String,
  first_name: String,
  last_name: String,
  birthday: Date,
  marital_status: String
}
```

## Error Handling

The API implements comprehensive error handling:

- 400: Bad Request - Invalid input data
- 404: Not Found - Resource not found
- 500: Internal Server Error - Server-side issues

## Development

### Project Structure
```
├── controllers/
│   ├── costController.js
│   └── userController.js
├── models/
│   ├── costs.js
│   └── users.js
├── routes/
│   ├── costRoutes.js
│   └── userRoutes.js
├── app.js
└── package.json
```

### Running Tests
```bash
npm test
```



## Security Note

- The MongoDB connection string in the code should be moved to environment variables
- Implement proper authentication and authorization
- Add input validation and sanitization
- Consider rate limiting for API endpoints
