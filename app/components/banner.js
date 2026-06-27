// app/components/banner.js
import { supabase } from '../core/supabase.js';

const CLOUD_BASE = 'https://himagrind.github.io/cloud/'; // url repo cloud HIMAGRIND

const SLOT_MAP = [
  { id: 'banner-top', slot: 'top', keepSpaceWhenEmpty: true },
  { id: 'banner-middle', slot: 'middle', keepSpaceWhenEmpty: false },
  { id: 'banner-small', slot: 'small', keepSpaceWhenEmpty: false }
];

let bannerCache = null;

function getPageKey() {
  const path = window.location.pathname.replace(/\/+/g, '/');

  if (path === '/' || path.endsWith('/index.html')) return 'home';
  if (path.includes('/pages/artikel.html')) return 'artikel';
  if (path.includes('/pages/kategori.html')) return 'kategori';
  if (path.includes('/pages/search.html')) return 'search';
  if (path.includes('/pages/tentang.html')) return 'tentang';
  if (path.includes('/pages/kirim-pesan.html')) return 'kirim-pesan';
  if (path.includes('/pages/kirim-tulisan.html')) return 'kirim-tulisan';
  if (path.includes('/pages/pengin-cerita.html')) return 'pengin-cerita';
  return 'all';
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveUrl(path = '') {
  const raw = String(path).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${CLOUD_BASE.replace(/\/+$/, '/')}${raw.replace(/^\/+/, '')}`;
}

function mimeFromPath(path = '') {
  const ext = String(path).split('.').pop().toLowerCase();
  if (ext === 'webm') return 'video/webm';
  if (ext === 'ogg' || ext === 'ogv') return 'video/ogg';
  return 'video/mp4';
}

async function loadBanners() {
  if (bannerCache) return bannerCache;

  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('[Banner]', error);
    bannerCache = [];
    return bannerCache;
  }

  bannerCache = (data || []).sort((a, b) => {
    const ao = Number(a.sort_order ?? 0);
    const bo = Number(b.sort_order ?? 0);
    if (ao !== bo) return ao - bo;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return bannerCache;
}

function matchesPage(targetPage, pageKey) {
  const value = String(targetPage || 'all').trim().toLowerCase();
  return value === 'all' || value === pageKey;
}

function chooseBanner(rows, slot, pageKey) {
  return rows.find(row =>
    String(row.slot || '').trim().toLowerCase() === slot &&
    matchesPage(row.target_page, pageKey)
  ) || null;
}

async function renderSlot(def, rows, pageKey) {
  const el = document.getElementById(def.id);
  if (!el) return;

  const banner = chooseBanner(rows, def.slot, pageKey);

  if (!banner) {
    el.innerHTML = '';
    el.hidden = !def.keepSpaceWhenEmpty;
    return;
  }

  el.hidden = false;

  const src = resolveUrl(banner.media_path);
  const alt = banner.alt_text || banner.title || 'Banner';
  const openNew = banner.open_in_new_tab !== false && !!banner.link_url;

  const linkOpen = banner.link_url
    ? `<a class="banner-link" href="${escapeHtml(banner.link_url)}"${openNew ? ' target="_blank" rel="noopener noreferrer"' : ''}>`
    : '';

  const linkClose = banner.link_url ? '</a>' : '';

  const media = banner.media_type === 'video'
    ? `
      <video class="banner-media banner-media--video" autoplay muted loop playsinline preload="metadata">
        <source src="${escapeHtml(src)}" type="${mimeFromPath(src)}">
      </video>`
    : `
      <img
        class="banner-media banner-media--image"
        src="${escapeHtml(src)}"
        alt="${escapeHtml(alt)}"
        loading="lazy"
        decoding="async"
      >`;

  el.innerHTML = `
    <section class="banner-shell banner-shell--${def.slot}">
      ${linkOpen}
        ${media}
      ${linkClose}
    </section>
  `;
}

const Banner = {
  async render() {
    const rows = await loadBanners();
    const pageKey = getPageKey();

    for (const def of SLOT_MAP) {
      await renderSlot(def, rows, pageKey);
    }
  }
};

export default Banner;
