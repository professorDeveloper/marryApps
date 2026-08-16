import { _mock } from './_mock';
import { _tags } from './assets';

// ----------------------------------------------------------------------

export const TOUR_DETAILS_TABS = [
  { label: 'Sayohat kontent', value: 'content' },
  { label: 'Bron beruvchi', value: 'bookers' },
];

export const TOUR_SORT_OPTIONS = [
  { label: 'Eng yangi', value: 'latest' },
  { label: 'Mashhur', value: 'popular' },
  { label: 'Eng eski', value: 'oldest' },
];

export const TOUR_PUBLISH_OPTIONS = [
  { label: 'Nashr qilingan', value: 'published' },
  { label: 'Qoralama', value: 'draft' },
];

export const TOUR_SERVICE_OPTIONS = [
  { label: 'Audio gid', value: 'Audio guide' },
  { label: 'Ovqat va ichimliklar', value: 'Food and drinks' },
  { label: 'Tushlik', value: 'Lunch' },
  { label: 'Shaxsiy sayohat', value: 'Private tour' },
  { label: 'Maxsus faoliyatlar', value: 'Special activities' },
  { label: 'Kirish to\'lovlari', value: 'Entrance fees' },
  { label: 'Bahshish', value: 'Gratuities' },
  { label: 'Olib ketish va tashlab ketish', value: 'Pick-up and drop off' },
  { label: 'Professional gid', value: 'Professional guide' },
  { label: 'Konditsioner transporti', value: 'Transport by air-conditioned' },
];

const CONTENT = `
<h6>Tavsifi</h6>

<p>Bu sayohat O'zbekistonning eng qiziqarli joylariga olib boradi. Qadimiy tumanlar, madaniy meroslar va tabiatning go'zalligi sizi hayratda qoldiradi.</p>

<h6>Asosiy joylar</h6>

<ul>
  <li>Samarqand shahri - qadimiy shaharlarnig bir.</li>
  <li>Bukhoro - tijorat yo'lining markazi.</li>
  <li>Xiva - raqiblardan dozirabning moydoni.</li>
  <li>Toshkent - zamonaviy o'zbekistonning do'kxona.</li>
</ul>

<h6>Dastur</h6>

<p>
  <strong>1-kun</strong>
</p>

<p>Toshkent shahriga kelish va mehmanxonaga yollanish. Shaharnomani o'rganish va stalinlarning esdalari.</p>

<p>
  <strong>2-kun</strong>
</p>

<p>Samarqandga borish. Qadimiy madaniy yodgorliklari va tarixiy joylarni ko'rib chiqish.</p>

<p>
  <strong>3-kun</strong>
</p>

<p>Buxoroga sayohat. Tarixiy bazaar va qadimiy arxitektura bilan tanishish va shuning uchun vaqt sarflash.</p>
`;

const BOOKER = Array.from({ length: 12 }, (_, index) => ({
  id: _mock.id(index),
  guests: index + 10,
  name: _mock.fullName(index),
  avatarUrl: _mock.image.avatar(index),
}));

export const _tourGuides = Array.from({ length: 12 }, (_, index) => ({
  id: _mock.id(index),
  name: _mock.fullName(index),
  avatarUrl: _mock.image.avatar(index),
  phoneNumber: _mock.phoneNumber(index),
}));

export const TRAVEL_IMAGES = Array.from({ length: 16 }, (_, index) => _mock.image.travel(index));

export const _tours = Array.from({ length: 12 }, (_, index) => {
  const available = { startDate: _mock.time(index + 1), endDate: _mock.time(index) };

  const publish = index % 3 ? 'published' : 'draft';

  const services = (index % 2 && ['Audio guide', 'Food and drinks']) ||
    (index % 3 && ['Lunch', 'Private tour']) ||
    (index % 4 && ['Special activities', 'Entrance fees']) || [
      'Gratuities',
      'Pick-up and drop off',
      'Professional guide',
      'Transport by air-conditioned',
    ];

  const tourGuides =
    (index === 0 && _tourGuides.slice(0, 1)) ||
    (index === 1 && _tourGuides.slice(1, 3)) ||
    (index === 2 && _tourGuides.slice(2, 5)) ||
    (index === 3 && _tourGuides.slice(4, 6)) ||
    _tourGuides.slice(6, 9);

  const images = TRAVEL_IMAGES.slice(index, index + 5);

  return {
    images,
    publish,
    services,
    available,
    tourGuides,
    bookers: BOOKER,
    content: CONTENT,
    id: _mock.id(index),
    tags: _tags.slice(0, 5),
    name: _mock.tourName(index),
    createdAt: _mock.time(index),
    durations: '4 days 3 nights',
    price: _mock.number.price(index),
    destination: _mock.countryNames(index),
    priceSale: _mock.number.price(index),
    totalViews: _mock.number.nativeL(index),
    ratingNumber: _mock.number.rating(index),
  };
});
