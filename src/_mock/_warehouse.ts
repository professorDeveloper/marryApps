import { _mock } from './_mock';

export const _warehouses = Array.from({ length: 4 }, (_, index) => ({
  id: _mock.id(index),
  name: `Sklad ${index + 1}`,
  code: `WH-${index + 1}`,
  stock: _mock.number.nativeL(index + 10),
  location: `Block ${index + 1}`,
  manager: _mock.fullName(index),
}));

export const _stocks = Array.from({ length: 4 }, (_, index) => ({
  id: _mock.id(index),
  sku: `STK-${100 + index}`,
  name: `Item ${index + 1}`,
  coverUrl: _mock.image.product(index),
  quantity: _mock.number.nativeL(index + 5),
  warehouseId: _mock.id(index % 4),
  location: `Shelf ${index + 1}`,
}));

export const _transfers = Array.from({ length: 4 }, (_, index) => ({
  id: _mock.id(index),
  fromWarehouse: `WH-${(index % 4) + 1}`,
  toWarehouse: `WH-${((index + 1) % 4) + 1}`,
  quantity: _mock.number.nativeL(index + 2),
  status: ['pending', 'completed', 'cancelled', 'in_transit'][index],
  createdAt: _mock.time(index),
}));

export const _locations = Array.from({ length: 4 }, (_, index) => ({
  id: _mock.id(index),
  name: `Location ${index + 1}`,
  code: `LOC-${index + 1}`,
  capacity: _mock.number.nativeL(index + 20),
}));

export const _suppliers = Array.from({ length: 4 }, (_, index) => ({
  id: _mock.id(index),
  name: _mock.fullName(index),
  company: _mock.companyNames(index),
  avatarUrl: _mock.image.avatar(index),
  contact: _mock.fullName(index + 2),
  phone: _mock.phoneNumber(index),
  email: _mock.email(index),
}));
