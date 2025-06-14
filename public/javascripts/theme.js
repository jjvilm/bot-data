// Theme Management
function initializeTheme() {
  // Check for saved theme preference or use system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
  
  // Apply theme
  applyTheme(savedTheme);
  
  // Update toggle switch
  updateThemeToggle(savedTheme);
}

function applyTheme(theme) {
  // Set theme on html element
  document.documentElement.setAttribute('data-bs-theme', theme);
  document.body.className = theme + '-mode';
  
  // Save preference
  localStorage.setItem('theme', theme);
  
  // Update meta theme-color
  const themeColor = theme === 'dark' ? '#1a1a2e' : '#f8f9fa';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
}

function updateThemeToggle(theme) {
  const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
  if (toggleSwitch) {
    toggleSwitch.checked = theme === 'light';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  updateThemeToggle(newTheme);
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  const newTheme = e.matches ? 'dark' : 'light';
  // Only apply system theme if no user preference is set
  if (!localStorage.getItem('theme')) {
    applyTheme(newTheme);
    updateThemeToggle(newTheme);
  }
});
