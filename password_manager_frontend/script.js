// script.js

// Initialize Google Sign-In
function initGoogleSignIn() {
  gapi.load('auth2', function() {
    gapi.auth2.init({
      client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
    }).then(() => {
      attachSignIn(document.getElementById('googleSignIn'));
    });
  });
}

// Attach Google Sign-In event
function attachSignIn(element) {
  const auth2 = gapi.auth2.getAuthInstance();
  auth2.attachClickHandler(element, {},
    function(googleUser) {
      const profile = googleUser.getBasicProfile();
      const id_token = googleUser.getAuthResponse().id_token;
      // Send token to backend for verification and processing
      fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: id_token })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          displayPasswordsSection();
        } else {
          alert('Failed to sign in with Google.');
        }
      })
      .catch(error => console.error('Error:', error));
    }, function(error) {
      alert(JSON.stringify(error, undefined, 2));
    });
}

// Handle form submission for registration
document.getElementById('register-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      displayPasswordsSection();
    } else {
      alert('Registration failed.');
    }
  })
  .catch(error => console.error('Error:', error));
});

// Display passwords section and fetch passwords
function displayPasswordsSection() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('passwords-section').style.display = 'block';
  fetchPasswords();
}

// Fetch passwords from backend
function fetchPasswords() {
  fetch('/api/passwords')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const passwordsList = document.getElementById('passwords-list');
      passwordsList.innerHTML = ''; // Clear existing entries
      data.passwords.forEach(password => {
        const entry = document.createElement('div');
        entry.textContent = `Email: ${password.email}, Password: ${password.password}`;
        passwordsList.appendChild(entry);
      });
    } else {
      alert('Failed to fetch passwords.');
    }
  })
  .catch(error => console.error('Error:', error));
}

// Add new password entry
document.getElementById('addPassword').addEventListener('click', function() {
  const email = prompt('Enter email:');
  const password = prompt('Enter password:');
  if (email && password) {
    fetch('/api/passwords/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        fetchPasswords(); // Refresh list
      } else {
        alert('Failed to add password.');
      }
    })
    .catch(error => console.error('Error:', error));
  }
});

// Call Google Sign-In initialization
initGoogleSignIn();
```