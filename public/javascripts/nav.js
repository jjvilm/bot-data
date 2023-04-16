const toggleMenu = document.querySelector('.toggle-menu');
const menu = document.querySelector('nav ul.menu');

toggleMenu.addEventListener('click', () => {
  console.log(1);
  menu.classList.toggle('active');
  toggleMenu.classList.toggle('active');
});
