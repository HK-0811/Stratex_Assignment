
## Setup

1. Clone the repository `git clone https://github.com/yourusername/book-management-system.git`
2. Install dependencies: `npm install`
3. Set up the database in the `.env` file
4. Run migrations: `npx prisma migrate dev`
5. Start the server: `npm run dev`

## Endpoints

- POST `/register` - Register a new user or seller
- POST `/login` - Login user or seller
- POST `/books/upload` - Upload books via CSV (sellers only)
- GET `/books` - Retrieve all books (authenticated users)
- GET `/books/:id` - Retrieve details of a specific book (authenticated users)
- PUT `/books/:id` - Update a book (sellers only)
- DELETE `/books/:id` - Delete a book (sellers only)

## Video Link
https://drive.google.com/file/d/1deB5yXJ-0O-qktCJtraMyrs4LxQhQXhS/view?usp=sharing
