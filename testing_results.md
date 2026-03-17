# FileTransit – Functional Testing Results

## 1. Testing Environment

The system was tested locally during development using the Django development server.

Environment details:

- Operating System: Windows 11
- Python Version: 3.12
- Django Version: 5.2.10
- Browser: Google Chrome / Microsoft Edge
- Server: Django development server (http://127.0.0.1:8000)

The tests focused on verifying the main functionality of the FileTransit web application.

---

## 2. Testing Method

Functional testing was performed to ensure that the key features of the system work correctly. Each feature was tested by interacting with the web interface and observing the system behaviour.

The testing process involved:

1. Running the Django development server
2. Accessing the application through a web browser
3. Performing actions such as registration, login, file upload and file download
4. Verifying that the expected results were produced

---

## 3. Test Cases

| Test ID | Test Description | Expected Result | Actual Result | Status |
|-------|----------------|----------------|---------------|-------|
| T1 | User Registration | A new user account can be created successfully | Account created successfully | PASS |
| T2 | User Login | Registered user can log into the system | User logged into the system | PASS |
| T3 | File Upload | User can upload a file successfully | File uploaded successfully | PASS |
| T4 | Share Code Generation | System generates a valid share code and QR code after upload | Share code and QR code displayed successfully | PASS |
| T5 | File Download | File can be downloaded using the transfer code | File downloaded successfully | PASS |
| T6 | Transfer History | Uploaded and downloaded files appear in the user's history page | Files displayed correctly in history | PASS |
| T7 | Invalid Share Code | System shows an error message for an invalid code | Error message displayed successfully | PASS |
| T8 | User Logout | User can log out and return to the login page | Logout successful and login page displayed | PASS |

---

## 4. Test Results

The main features of the FileTransit system were tested successfully. The system allowed users to register and log into the platform, upload files, generate share codes and QR codes, and download files using the provided transfer code.

The transfer history feature also worked correctly, showing both sent and received files in the history page. In addition, the system handled invalid share codes properly by displaying an error message, and the logout function successfully returned the user to the login page.

Overall, the functional testing results show that the main features of the application work as intended and meet the core requirements of the system.

---

## 5. Future Testing Improvements

Although the main functionality was tested successfully, further testing could be carried out in future versions of the project. For example, additional tests could be performed for large file uploads, expired share codes, unsupported file types, and multiple users accessing the system at the same time.

It would also be useful to add more automated tests in Django to improve test coverage and reduce the need for repeated manual testing during future development.