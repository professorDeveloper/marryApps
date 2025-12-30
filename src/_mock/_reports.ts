import { _mock } from './_mock';

// Reports with template-friendly fields (cover image, author, etc.)
export const _reports = Array.from({ length: 8 }, (_, index) => ({
  id: _mock.id(index),
  title: _mock.postTitle(index),
  coverUrl: _mock.image.cover(index),
  author: _mock.fullName(index),
  authorAvatar: _mock.image.avatar(index),
  createdAt: _mock.time(index),
  summary: _mock.sentence(index),
  type: ['sales', 'inventory', 'custom', 'archive', 'sales', 'inventory', 'custom', 'archive'][index],
  readTime: `${_mock.number.nativeL(index + 1)} mins`,
  views: _mock.number.nativeL(index + 10) * 10,
}));

export const _reportsSales = _reports.filter((r) => r.type === 'sales');
export const _reportsInventory = _reports.filter((r) => r.type === 'inventory');
export const _reportsCustom = _reports.filter((r) => r.type === 'custom');
export const _reportsArchives = _reports.filter((r) => r.type === 'archive');
