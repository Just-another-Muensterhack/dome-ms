const toggle = document.querySelector('.menu-toggle')
const nav = document.querySelector('#site-nav')

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open')
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
  })
}

const form = document.querySelector('.contact-form')
const note = document.querySelector('.form-note')

if (form && note) {
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    note.hidden = false
    form.reset()
  })
}
