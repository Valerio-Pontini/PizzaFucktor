import test from 'node:test';
import assert from 'node:assert/strict';
import { mapPrivatePizzeria, mapPublicPizzeria } from '../app/pizzeria-data.ts';

test('public pizzeria cards exclude reservation references and team notes', () => {
  const row = {
    pizzeriaName: 'Pizzeria di prova', address: 'Via del Forno 8', city: 'Roma', phone: '061234',
    website: 'https://example.test', mapsUrl: 'https://maps.example.test', dinnerDate: '2026-12-01',
    dinnerTime: '20:00', bookingStatus: 'prenotato', bookedUnder: 'Ada Example',
    confirmationCode: 'CONF-123', notes: 'Allergia dichiarata al telefono',
  };
  const publicPizzeria = mapPublicPizzeria(row);
  assert.equal(publicPizzeria.name, 'Pizzeria di prova');
  assert.equal('bookedUnder' in publicPizzeria, false);
  assert.equal('confirmationCode' in publicPizzeria, false);
  assert.equal('notes' in publicPizzeria, false);
  assert.equal(mapPrivatePizzeria(row).confirmationCode, 'CONF-123');
});

test('an unchosen pizzeria serializes as null', () => {
  assert.equal(mapPublicPizzeria({ pizzeriaName: null }), null);
  assert.equal(mapPrivatePizzeria({ pizzeriaName: null }), null);
});
