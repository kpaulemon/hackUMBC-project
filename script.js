 document.addEventListener('DOMContentLoaded', () => {
        const heading = document.querySelector('h1');
        heading.addEventListener('click', () => {
            heading.textContent = 'Clicked!';
        });
    });
