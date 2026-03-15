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
| T3 | File Upload | User can upload a file and receive a transfer code | File uploaded and transfer code generated | PASS |
| T4 | File Download | File can be downloaded using the transfer code | File downloaded successfully | PASS |
| T5 | Transfer History | Uploaded files appear in the user's history page | Uploaded files displayed correctly | PASS |

---

## 4. Test Results

All core features of the FileTransit system were tested successfully. The system allowed users to register and log into the platform, upload files, generate transfer codes, and download files using the provided codes.

The transfer history feature also functioned correctly, allowing users to view previously uploaded files.

No major errors were encountered during functional testing. The results confirm that the main functionality of the application works as intended.

---

## 5. Future Testing Improvements

The functional testing confirmed that the core features of the FileTransit system operate correctly. Users are able to register and log in to the system, upload files, share them using a transfer code, and download files using the provided code.

The transfer history feature also works as expected, allowing users to review their previously uploaded files.

No critical functional issues were encountered during testing. Overall, the implemented system satisfies the functional requirements described in the design specification and provides a simple and effective method for file sharing through a web interface.