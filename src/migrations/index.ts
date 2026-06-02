import * as migration_20260511_075336 from './20260511_075336';
import * as migration_20260513_024351 from './20260513_024351';
import * as migration_20260513_031830 from './20260513_031830';
import * as migration_20260513_043313 from './20260513_043313';
import * as migration_20260519_133251 from './20260519_133251';
import * as migration_20260520_050915 from './20260520_050915';
import * as migration_20260520_153805 from './20260520_153805';
import * as migration_20260521_events_public_fields from './20260521_events_public_fields';
import * as migration_20260521_navigation_events_partners from './20260521_navigation_events_partners';
import * as migration_20260522_navigation_cta_and_faq_fix from './20260522_navigation_cta_and_faq_fix';
import * as migration_20260523_add_strategists from './20260523_add_strategists';
import * as migration_20260526_events_member_preview_until from './20260526_events_member_preview_until';
import * as migration_20260527_polish_event_metrics_and_case_study_partner from './20260527_polish_event_metrics_and_case_study_partner';
import * as migration_20260529_partners_directory_gtm from './20260529_partners_directory_gtm';

export const migrations = [
  {
    up: migration_20260511_075336.up,
    down: migration_20260511_075336.down,
    name: '20260511_075336',
  },
  {
    up: migration_20260513_024351.up,
    down: migration_20260513_024351.down,
    name: '20260513_024351',
  },
  {
    up: migration_20260513_031830.up,
    down: migration_20260513_031830.down,
    name: '20260513_031830',
  },
  {
    up: migration_20260513_043313.up,
    down: migration_20260513_043313.down,
    name: '20260513_043313',
  },
  {
    up: migration_20260519_133251.up,
    down: migration_20260519_133251.down,
    name: '20260519_133251',
  },
  {
    up: migration_20260520_050915.up,
    down: migration_20260520_050915.down,
    name: '20260520_050915',
  },
  {
    up: migration_20260520_153805.up,
    down: migration_20260520_153805.down,
    name: '20260520_153805'
  },
  {
    up: migration_20260521_events_public_fields.up,
    down: migration_20260521_events_public_fields.down,
    name: '20260521_events_public_fields',
  },
  {
    up: migration_20260521_navigation_events_partners.up,
    down: migration_20260521_navigation_events_partners.down,
    name: '20260521_navigation_events_partners',
  },
  {
    up: migration_20260522_navigation_cta_and_faq_fix.up,
    down: migration_20260522_navigation_cta_and_faq_fix.down,
    name: '20260522_navigation_cta_and_faq_fix',
  },
  {
    up: migration_20260523_add_strategists.up,
    down: migration_20260523_add_strategists.down,
    name: '20260523_add_strategists',
  },
  {
    up: migration_20260526_events_member_preview_until.up,
    down: migration_20260526_events_member_preview_until.down,
    name: '20260526_events_member_preview_until',
  },
  {
    up: migration_20260527_polish_event_metrics_and_case_study_partner.up,
    down: migration_20260527_polish_event_metrics_and_case_study_partner.down,
    name: '20260527_polish_event_metrics_and_case_study_partner',
  },
  {
    up: migration_20260529_partners_directory_gtm.up,
    down: migration_20260529_partners_directory_gtm.down,
    name: '20260529_partners_directory_gtm',
  },
];
