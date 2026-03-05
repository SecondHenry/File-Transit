# Changelog

## 2026-02-24 - User Authentication (Django Built-in Auth)

Implemented real registration, login, and logout using Django's built-in `django.contrib.auth`.

### Modified Files

- **FileTransit/views.py**
  - Added `login_view()`: POST username/password, authenticate via `django.contrib.auth.authenticate()`, session login
  - Added `signup_view()`: POST username/password/confirm_password, validate, `User.objects.create_user()`, auto-login after signup
  - Added `logout_view()`: call `django.contrib.auth.logout()`, redirect to transfer page
  - All views use `django.contrib.messages` for success/error feedback

- **FileTransit/urls.py**
  - Added 3 auth routes: `/login/`, `/signup/`, `/logout/`

- **templates/transfer.html**
  - Auth area now uses `{% if user.is_authenticated %}` to switch between profile panel and login/signup forms
  - Login form: `<form method="post" action="{% url 'login' %}">` with `{% csrf_token %}`
  - Signup form: `<form method="post" action="{% url 'signup' %}">` with confirm password field
  - Logout changed from JS to `<a href="{% url 'logout' %}">`
  - Added `{% for message in messages %}` block for auth feedback display

- **templates/base.html**
  - Added `{{ user.username }}` display in nav-right when authenticated

- **static/js/app.js**
  - Removed old mock auth logic (simulated login/logout via JS)
  - Kept login/signup form toggle (show/hide `#loginForm` / `#signupForm`)

- **static/css/style.css**
  - Added `.auth-messages`, `.auth-msg`, `.auth-msg-success`, `.auth-msg-error` styles
  - Added `.nav-user` style for username display in navigation bar

---

## 2026-02-24 - Initial Frontend Implementation

Based on Wireframe-v2.0.0.pdf, created a SendAnywhere-style file transfer website frontend with Django serving.

### Modified Files

- **FileTransit/settings.py**
  - Added `BASE_DIR / 'templates'` to `TEMPLATES.DIRS`
  - Added `STATICFILES_DIRS = [BASE_DIR / 'static']`

- **FileTransit/urls.py**
  - Imported `views` from current package
  - Added 3 URL routes: `/` (transfer), `/history/`, `/help/`

### New Files

- **FileTransit/views.py**
  - `transfer()` - renders transfer.html (homepage)
  - `history()` - renders history.html
  - `help_page()` - renders help.html

- **templates/base.html**
  - Base template with top navigation bar (Logo, Transfer, History, Help)
  - Loads static CSS and JS

- **templates/transfer.html**
  - Send Area: 3 states (initial upload / files selected / file transferred with share code)
  - Receive Area: 6-digit code input + download button
  - Auth Area: Login/Signup toggle, username/password fields, profile panel after login

- **templates/history.html**
  - Function Area: filter (All/Sent/Received), action buttons (Resend/Rename/Download/Delete)
  - File Explorer: table with checkbox selection, sample data rows

- **templates/help.html**
  - How to Send/Receive instructions, History usage, Account info, FAQ section

- **static/css/style.css**
  - CSS variables for theming
  - Card, button, form, table component styles
  - Responsive breakpoints: 768px (tablet, single column), 480px (mobile, simplified)

- **static/js/app.js**
  - Transfer page: file upload (click + drag & drop), file list rendering, send/back state transitions, share code generation, 10-min countdown timer, auth login/signup/logout toggle
  - History page: filter toggle, row checkbox selection, select all, action button enable/disable, delete/rename/download/resend demos
