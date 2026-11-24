export type PizzeriaRow = {
  pizzeriaName: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  menuText?: string | null;
  menuUrl?: string | null;
  dinnerDate: string | null;
  dinnerTime: string | null;
  bookingStatus: string | null;
  bookedUnder?: string | null;
  confirmationCode?: string | null;
  notes?: string | null;
};

export function mapPublicPizzeria(row: PizzeriaRow) {
  if (!row.pizzeriaName) return null;
  return {
    name: row.pizzeriaName,
    address: row.address ?? '',
    city: row.city ?? '',
    phone: row.phone ?? '',
    website: row.website ?? '',
    mapsUrl: row.mapsUrl ?? '',
    menuText: row.menuText ?? '',
    menuUrl: row.menuUrl ?? '',
    dinnerDate: row.dinnerDate ?? '',
    dinnerTime: row.dinnerTime ?? '',
    bookingStatus: row.bookingStatus ?? 'da_prenotare',
  };
}

export function mapPrivatePizzeria(row: PizzeriaRow) {
  const pizzeria = mapPublicPizzeria(row);
  if (!pizzeria) return null;
  return {
    ...pizzeria,
    bookedUnder: row.bookedUnder ?? '',
    confirmationCode: row.confirmationCode ?? '',
    notes: row.notes ?? '',
  };
}
