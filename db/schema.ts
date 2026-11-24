import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    username: text('username').notNull(),
    usernameNorm: text('username_norm').notNull(),
    passwordHash: text('password_hash').notNull(),
    passwordSalt: text('password_salt').notNull(),
    passwordIterations: integer('password_iterations').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [uniqueIndex('accounts_username_norm_unique').on(table.usernameNorm)],
);

export const authSessions = sqliteTable(
  'auth_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => [index('auth_sessions_user_id_idx').on(table.userId)],
);

export const authRateLimits = sqliteTable('auth_rate_limits', {
  rateKey: text('rate_key').primaryKey(),
  attempts: integer('attempts').notNull(),
  windowStartedAt: integer('window_started_at').notNull(),
  lockedUntil: integer('locked_until').notNull(),
});

export const teams = sqliteTable(
  'teams',
  {
    id: text('id').primaryKey(),
    editionId: text('edition_id').notNull(),
    slot: integer('slot').notNull(),
    name: text('name').notNull(),
    inviteCode: text('invite_code').notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('teams_invite_code_unique').on(table.inviteCode),
    uniqueIndex('teams_edition_slot_unique').on(table.editionId, table.slot),
    check('teams_slot_range', sql`${table.slot} BETWEEN 1 AND 5`),
  ],
);

export const teamMembers = sqliteTable(
  'team_members',
  {
    userId: text('user_id').primaryKey(),
    teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    email: text('email').notNull(),
    username: text('username').notNull().default(''),
    joinedAt: text('joined_at').notNull(),
  },
  (table) => [index('team_members_team_id_idx').on(table.teamId)],
);

export const pizzerias = sqliteTable(
  'pizzerias',
  {
    teamId: text('team_id').primaryKey().references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    address: text('address').notNull(),
    city: text('city'),
    phone: text('phone'),
    website: text('website'),
    menuText: text('menu_text'),
    menuUrl: text('menu_url'),
    mapsUrl: text('maps_url'),
    dinnerDate: text('dinner_date'),
    dinnerTime: text('dinner_time'),
    bookingStatus: text('booking_status').notNull(),
    bookedUnder: text('booked_under'),
    confirmationCode: text('confirmation_code'),
    notes: text('notes'),
    updatedBy: text('updated_by').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    check('pizzerias_booking_status', sql`${table.bookingStatus} IN ('da_prenotare', 'da_confermare', 'prenotato')`),
  ],
);

export const tableNotes = sqliteTable('table_notes', {
  userId: text('user_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  id: text('id').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.teamId, table.id] })]);

export const votes = sqliteTable(
  'votes',
  {
    id: text('id').primaryKey(),
    pizzeriaTeamId: text('pizzeria_team_id').notNull().references(() => pizzerias.teamId, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    pizzaScore: integer('pizza_score').notNull(),
    frittiScore: integer('fritti_score').notNull(),
    menuScore: integer('menu_score').notNull(),
    serviceScore: integer('service_score').notNull(),
    ambienceScore: integer('ambience_score').notNull(),
    notes: text('notes').notNull().default(''),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('votes_pizzeria_user_unique').on(table.pizzeriaTeamId, table.userId),
    index('votes_pizzeria_team_idx').on(table.pizzeriaTeamId),
    index('votes_user_updated_idx').on(table.userId, table.updatedAt),
    check('votes_score_range', sql`${table.pizzaScore} BETWEEN 1 AND 20 AND ${table.frittiScore} BETWEEN 1 AND 10 AND ${table.menuScore} BETWEEN 1 AND 10 AND ${table.serviceScore} BETWEEN 1 AND 10 AND ${table.ambienceScore} BETWEEN 1 AND 10`),
  ],
);
