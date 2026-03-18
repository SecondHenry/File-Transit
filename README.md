# FileTransit – Web-based File Transfer Application

## Overview

FileTransit is a web-based file transfer application developed using Python and the Django framework. The system allows users to upload files and share them with others through a short transfer code or a generated download link.

Unlike traditional file sharing methods such as Bluetooth or local network transfer, FileTransit works entirely in the browser and can be accessed from any device without additional software installation.

The application supports user authentication, file upload, transfer history management, and multiple sharing methods including QR codes and direct links.

---

## Features

### Core Functionality

- User authentication (login / logout / session management)
- Upload files and generate a unique transfer code
- Download files using a transfer code or direct link
- File expiration with countdown timer
- Transfer history management (view, rename, delete, resend)
- File size limit enforcement (32MB)

---

### Front-end Interactivity

The application includes significant client-side interactivity implemented using JavaScript and asynchronous requests:

- AJAX-based file upload and history loading
- Dynamic UI updates without full page reload
- Drag-and-drop file upload
- Copy-to-clipboard functionality for sharing links
- QR code generation for quick sharing
- Real-time countdown timer for file expiration
- Client-side validation for file input and forms
- Interactive notifications for success and error feedback

---

### User Interface

- Responsive design (desktop, tablet, mobile)
- Consistent layout and styling
- Accessible form inputs and navigation
- Interactive components such as toggles and filters

---

## Technology Stack

### Backend

- Python: 3.12.10
- Django: 5.2.10

### Frontend

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Fetch API (AJAX)

### Database

- SQLite (development)
- (Optional: PostgreSQL for production)

---

## Project Structure

```
File-Transit/
├── FileTransit/                # Django project configuration
│   ├── __init__.py
│   ├── settings.py             # Project settings (database, apps, middleware)
│   ├── urls.py                 # Root URL routing
│   ├── views.py                # Shared views (e.g. cookie policy)
│   ├── asgi.py
│   └── wsgi.py
│
├── manager/                    # Core app — file upload, sharing, history
│   ├── models.py               # ShareItem, FileContent, DownloadRecord
│   ├── views.py                # API endpoints (upload, download, history CRUD)
│   ├── urls.py                 # /api/ URL routing
│   ├── utils.py                # Helper functions (code generation, cleanup)
│   ├── admin.py
│   ├── apps.py
│   ├── tests.py
│   └── migrations/
│
├── users/                      # Auth app — login, logout, registration
│   ├── models.py
│   ├── views.py                # Authentication views
│   ├── urls.py                 # /users/ URL routing
│   ├── admin.py
│   ├── apps.py
│   ├── tests.py
│   └── migrations/
│
├── templates/                  # Django templates (server-side rendered)
│   ├── base.html               # Master layout (nav, notifications, meta)
│   ├── transfer.html           # File upload / download interface
│   ├── history.html            # File explorer with actions
│   └── help.html               # Documentation / FAQ
│
├── static/                     # Static assets
│   ├── css/
│   │   └── style.css           # All styles + dark mode + responsive
│   └── js/
│       └── app.js              # Client-side logic (upload, AJAX, UI)
│
├── files/uploads/              # Uploaded file storage (content-addressed)
├── db.sqlite3                  # SQLite database (development)
├── manage.py                   # Django management script
└── README.md
```

---

## Installation

### 1. Clone the repository

git clone https://github.com/SecondHenry/File-Transit.git

---

### 2. Create virtual environment

python -m venv venv

Activate:

Windows:
venv\Scripts\activate

Mac/Linux:
source venv/bin/activate

---

### 3. Install dependencies

pip install django==5.2.10

---

### 4. Run migrations

python manage.py migrate

---

### 5. Run the server

python manage.py runserver

Open in browser:

http://127.0.0.1:8000/

---

## Usage

### Upload File

1. Log in to the system
2. Select or drag a file into the upload area
3. Click "Send"
4. Receive a transfer code and download link

---

### Download File

- Enter the transfer code on the homepage  
OR  
- Use the generated download link directly

---

### Manage History

- View previously uploaded files
- Rename file records
- Delete history entries
- Resend files to generate new codes

---

## Accessibility

The application includes several accessibility improvements:

- Proper label associations for form inputs
- Keyboard navigation support
- ARIA attributes for interactive elements
- Clear visual feedback and notifications

---

## Sustainability & Performance

The application was evaluated using Google Lighthouse:

- Lightweight frontend with minimal dependencies
- Optimised resource usage
- Fast loading times with high performance scores

Further optimisations include:

- Reduced unnecessary scripts
- Efficient DOM updates
- Optimised file handling logic

---

## Deployment

The application is deployed and publicly accessible at:

https://filetransit.mza5oti0ms5d.studio/
---

## Repository

GitHub Repository:

https://github.com/SecondHenry/File-Transit.git
---

## Future Improvements

- Multi-file upload support
- Larger file size handling with chunk upload
- Cloud storage integration
- User storage quota management
- Improved UI animations and transitions

---

## Author

Developed as part of the Internet Technology (M) course.

---