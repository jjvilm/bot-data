const toggleMenu = document.querySelector('.toggle-menu');
const menu = document.querySelector('nav ul.menu');

if (toggleMenu) {
  toggleMenu.addEventListener('click', () => {
    menu.classList.toggle('active');
    toggleMenu.classList.toggle('active');
  });
}

