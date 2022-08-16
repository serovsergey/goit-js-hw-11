import '../css/styles.css';
import Notiflix from 'notiflix';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";
import cardsTpl from '../templates/cards.hbs';
import axios from 'axios';

const INFINITE_SCROLL_KEY = 'infinite-scroll';
const BASE_URL = 'https://pixabay.com/api/?';
const API_KEY = '9050134-41fe2ca79f29d6928e7cd9c9b';

const refs = {
  form: document.querySelector("#search-form"),
  infiniteScroll: document.querySelector("#infinite-scroll"),
  gallery: document.querySelector(".gallery"),
  loadBtn: document.querySelector(".load-more"),
  sorry: document.querySelector(".sorry"),
}
const scrollNext = () => {
  const { height: cardHeight } = refs.gallery
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: "smooth",
  });
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

const getPhotos = async (q, page, per_page) => {
  const params = new URLSearchParams({
    key: API_KEY,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page,
    per_page,
    q,
  }).toString();
  return await axios.get(`${BASE_URL}${params}`);
}

refs.infiniteScroll.checked = localStorage.getItem(INFINITE_SCROLL_KEY) === "true";
refs.infiniteScroll.addEventListener('input', evt => localStorage.setItem(INFINITE_SCROLL_KEY, evt.target.checked));

const PER_PAGE = 40;
let currentPage;
let searchQuery;

const loadNextChunk = async (q = '', first = false) => {
  if (first) {
    currentPage = 0;
    searchQuery = q;
    refs.gallery.textContent = '';
  }
  currentPage++;
  const data = (await getPhotos(searchQuery, currentPage, PER_PAGE)).data;
  if (data.hits.length === 0) {
    refs.loadBtn.classList.add('hidden');
    Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again.');
    refs.gallery.textContent = 'No images to show';
    return;
  }
  refs.gallery.insertAdjacentHTML('beforeend', cardsTpl(data.hits));
  lightbox.refresh();
  if (first) {
    Notiflix.Notify.info(`Hooray! We have found ${data.total} images(availavle ${data.totalHits})`);
    scrollToTop();
  } else {
    scrollNext();
  }
  if (data.totalHits > currentPage * PER_PAGE) {
    refs.loadBtn.classList.remove('hidden');
    refs.sorry.classList.add('hidden');
  }
  else {
    refs.loadBtn.classList.add('hidden');
    refs.sorry.classList.remove('hidden');
  }
}

refs.loadBtn.addEventListener('click', loadNextChunk);

refs.form.addEventListener('submit', evt => {
  evt.preventDefault();
  const searchQuery = evt.currentTarget.elements.searchQuery.value.trim().toLowerCase();
  loadNextChunk(searchQuery, true);
})

const lightbox = new SimpleLightbox('.gallery a', { captionsData: 'alt', captionDelay: 250 });

const observer = new IntersectionObserver((entries, observer) => {
  if (!refs.infiniteScroll.checked) return;
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadNextChunk();
    }
  });
}, { root: null, rootMargin: '0px', threshold: 0.25 });
observer.observe(refs.loadBtn);
