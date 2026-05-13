import * as migration_20260511_075336 from './20260511_075336';
import * as migration_20260513_024351 from './20260513_024351';

export const migrations = [
  {
    up: migration_20260511_075336.up,
    down: migration_20260511_075336.down,
    name: '20260511_075336',
  },
  {
    up: migration_20260513_024351.up,
    down: migration_20260513_024351.down,
    name: '20260513_024351'
  },
];
