import * as migration_20260511_075336 from './20260511_075336';
import * as migration_20260513_024351 from './20260513_024351';
import * as migration_20260513_031830 from './20260513_031830';
import * as migration_20260513_043313 from './20260513_043313';
import * as migration_20260519_133251 from './20260519_133251';

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
    name: '20260519_133251'
  },
];
