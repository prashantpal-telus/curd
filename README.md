# CRUD App with Cline Rules

This CRUD (Create, Read, Update, Delete) application follows specific rules and guidelines for development using Cline, our AI-powered development assistant.

## Cline Rules for CRUD App Development

### 1. Commit Message Guidelines

#### Getting Started with Commit Message Generator

1. Install dependencies:
   ```bash
   cd commit-message-generator
   npm install
   ```

2. Set up environment:
   ```bash
   cp .env.example .env
   # Add your Fuelix API key to .env file
   ```

3. Use the generator:
   ```bash
   # Generate message only
   node commit-message-generator/index.js
   
   # Generate and auto-commit
   node commit-message-generator/index.js --auto-commit
   ```

#### Handling Multiple Changes

When your commit contains changes related to different features or fixes:

1. **Split Commits**: Ideally, split your changes into separate commits:
   ```bash
   # Stage files for first feature
   git add feature1-files
   node commit-message-generator/index.js --auto-commit

   # Stage files for second feature
   git add feature2-files
   node commit-message-generator/index.js --auto-commit
   ```

2. **Combined Commits**: If changes must be committed together:
   - The generator will analyze all staged changes
   - It will generate a message that covers all changes
   - Format will be like:
     ```
     feat(module1,module2): implement feature X and fix issue Y
     
     - Add new authentication flow in user module
     - Fix data validation in orders module
     ```

#### Commit Types

- feat: New features
- fix: Bug fixes
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Test cases
- chore: Build, dependencies, etc.

#### Best Practices

1. Keep changes focused and related
2. Use clear branch names reflecting the feature/fix
3. Review generated messages for accuracy
4. Add detailed descriptions for complex changes
5. Reference issue numbers in commit messages

### 2. Code Organization

- Keep all API routes in `server.js`
- Frontend code goes in `public/` directory
- Use meaningful component and function names
- Follow consistent code formatting
- Document complex logic with comments

### 3. Testing Guidelines

- Write tests for new features in `*.test.js` files
- Run tests before committing changes
- Maintain test coverage for critical functionality

### 4. Development Workflow

1. Create feature branch from main
2. Make changes following code guidelines
3. Write/update tests
4. Use Cline for code review
5. Generate commit message using the generator
6. Submit pull request

### 5. Using Cline for Development

- Ask Cline for help with:
  - Code reviews
  - Bug fixes
  - Feature implementation
  - Test case writing
  - Performance optimization
  - Security improvements

### 6. API Development Rules

- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Implement proper error handling
- Validate all input data
- Use meaningful status codes
- Document all API endpoints

### 7. Frontend Development Rules

- Follow responsive design principles
- Implement proper error handling
- Use semantic HTML
- Follow accessibility guidelines
- Optimize performance

### 8. Security Rules

- Validate all user input
- Implement proper authentication
- Use secure session management
- Follow OWASP security guidelines
- Regular security audits

## Project Structure

```
crud-app/
├── commit-message-generator/  # Commit message generation tool
├── public/                   # Frontend files
│   ├── index.html
│   ├── main.js
│   └── styles.css
├── server.js                 # Backend API server
└── README.md                 # This file
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Run tests:
   ```bash
   npm test
   ```

Remember to always consult Cline when you need assistance with development tasks, code reviews, or best practices implementation.
