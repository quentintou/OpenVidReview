# OpenVidReview

This project is a a collaborative video review and annotation tool. It allows users to upload videos, add comments with timestamps, color tags, and export comments as EDL files for use in video editing software like DaVinci Resolve.

The project is a work in progress and any use is at your own risk!

If you want to help in any capacity or contact me send me an email at david [a] davidguva.se and if you for some reason wants to say thanks you can [buy me a coffee](https://buymeacoffee.com/davidguva).

## Features

-   Video upload
-   Simple admin interface
-   Time-based comments
-   Color tags for comments
-   Edit and delete comments
-   Export comments as EDL files

## Todos

-   Implement the use of encrypted passwords (especially for the admin interface)
-   Real-time updates with Socket.io
-   Overall to make it as secure as possible and ready for production.

I would love for people to test this and give feedback.

## Technologies Used

-   Node.js
-   Express.js
-   SQLite
-   EJS (Embedded JavaScript templating)
-   Socket.io
-   HTML/CSS/JavaScript
-   Cloudinary (pour le stockage des vidéos)

## Getting Started

### Prerequisites

-   Node.js and npm installed
-   SQLite installed
-   Cloudinary account (for video storage)

### Installation using NodeJS

1. Clone the repository:

    ```bash
    git clone https://github.com/davidguva/OpenVidReview.git
    cd OpenVidReview
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory with the following content:

    ```
    # Configuration du serveur
    PORT=3000
    PASSWORD=your_admin_password
    SECRET=your_session_secret
    TITLE=OpenVidReview

    # Configuration Cloudinary
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

4. Start the server:

    ```bash
    npm start
    ```

5. Access the application at `http://localhost:3000`

### Installation using Docker

1. Clone the repository:

    ```bash
    git clone https://github.com/davidguva/OpenVidReview.git
    cd OpenVidReview
    ```

2. Build and start the container:

    `docker compose up -d`

### Deployment on Render

This application can be easily deployed on Render:

1. Fork or push this repository to your GitHub account
2. Sign up for a Render account
3. Create a new Web Service on Render, connected to your GitHub repository
4. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add the required environment variables in the Render dashboard
6. Deploy the application

For more detailed instructions, see the [Render deployment documentation](https://render.com/docs/deploy-node-express-app).
