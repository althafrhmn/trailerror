# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Trailerror

## Installation

```bash
# Clone the repository
git clone https://github.com/althafrhmn/trailerror.git
cd trailerror

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm run dev
```

## Project Overview

Trailerror is a web application with features including user authentication, messaging, and attendance tracking. The project uses:

- **Frontend**: React, Axios, Material-UI
- **Backend**: Express.js, MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Email Service Dependencies

The following dependencies are required for the email functionality:

- **nodemailer**: Used for sending emails from the application
- **dotenv**: For managing environment variables including email credentials
- **nodemailer-express-handlebars**: For email templating (if used)

## Email Configuration

To configure the email service, ensure the following environment variables are set in your `.env` file:

```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

Notes:
- For Gmail, you'll need to create an "App Password" in your Google Account security settings
- Make sure 2FA (Two-Factor Authentication) is enabled on your Google account to generate app passwords

## Setting Up Email Functionality

1. Install the required dependencies:
   ```
   npm install nodemailer dotenv nodemailer-express-handlebars
   ```

2. Create your `.env` file with the required credentials

3. The email service is implemented in `server/services/emailService.js`

## Testing Email Connection

You can test your email configuration by running:
```
node server/testEmailService.js
```

## Messaging System Dependencies

The messaging system requires the following dependencies:

- **express**: For creating the messaging API endpoints
- **mongoose**: For database interactions with message data
- **socket.io** (optional): For real-time messaging functionality
- **axios**: For API calls from the frontend

## Messaging Configuration

The messaging system includes a test connection endpoint to verify connectivity:

- `/messages/test-connection`: Confirms if the messaging API is operational

## Troubleshooting

- If emails are not being sent, check your firewall settings
- Verify your email credentials in the .env file
- For Gmail, ensure "Less secure app access" is enabled or use App Passwords
- For messaging issues, check network connectivity and verify server is running
- If experiencing intermittent connection issues, the system supports a fallback to demo mode
