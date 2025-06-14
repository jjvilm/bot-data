document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const form = document.querySelector('form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Form validation
    form.addEventListener('submit', function(e) {
        let isValid = true;
        const errors = [];

        // Username validation
        if (!usernameInput.value.trim()) {
            errors.push('Username is required');
            isValid = false;
        }

        // Password validation
        if (!passwordInput.value) {
            errors.push('Password is required');
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
            alert(errors.join('\\n'));
        }
    });

    // Focus first input on page load
    usernameInput.focus();
});
