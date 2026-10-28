/* eslint-disable @typescript-eslint/no-explicit-any */
import isDarkMode from '../utils/isDarkMode';
import getPeriod from '../utils/getPeriod';
import { colorFromId } from '../plugins/shared/customColors';
import { fmtDateSince } from '../components/task-card/utils/fmtDate';
import { deleteCustomTask } from '../plugins/shared/customTask';
import { setCustomOverride } from '../plugins/shared/customOverride';
import { AssignmentStatus } from '../types/assignment';
import chrome from 'sinon-chrome';

beforeAll(() => {
  global.chrome = chrome as unknown as typeof global.chrome;
});

describe('isDarkMode color analysis', () => {
  afterEach(() => {
    document.body.style.backgroundColor = '';
  });

  test('detects pure black as dark mode', () => {
    document.body.style.backgroundColor = 'rgb(0, 0, 0)';
    expect(isDarkMode()).toBe(true);
  });

  test('detects dark gray as dark mode', () => {
    document.body.style.backgroundColor = 'rgb(30, 30, 30)';
    expect(isDarkMode()).toBe(true);
  });

  test('detects pure white as light mode', () => {
    document.body.style.backgroundColor = 'rgb(255, 255, 255)';
    expect(isDarkMode()).toBe(false);
  });

  test('detects bright yellow as light mode', () => {
    document.body.style.backgroundColor = 'rgb(255, 255, 0)';
    expect(isDarkMode()).toBe(false);
  });

  test('detects transparent as light mode', () => {
    document.body.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    expect(isDarkMode()).toBe(false);
  });
});

describe('getPeriod ThreeDay navigation', () => {
  test('ThreeDay navigation shifts by 3 days per delta', () => {
    const period0 = getPeriod('ThreeDay', 1, 0, 0, 0);
    const period1 = getPeriod('ThreeDay', 1, 0, 0, 1);
    const period2 = getPeriod('ThreeDay', 1, 0, 0, 2);

    const diffDays01 = Math.round(
      (period1.start.getTime() - period0.start.getTime()) / (1000 * 3600 * 24)
    );
    const diffDays12 = Math.round(
      (period2.start.getTime() - period1.start.getTime()) / (1000 * 3600 * 24)
    );

    expect(diffDays01).toBe(3);
    expect(diffDays12).toBe(3);

    const periodSpan = Math.round(
      (period0.end.getTime() - period0.start.getTime()) / (1000 * 3600 * 24)
    );
    expect(periodSpan).toBe(3);
  });
});

describe('colorFromId handles all hash/number values', () => {
  test('never returns undefined for negative numbers or overflowed string hashes', () => {
    expect(colorFromId(-1)).toBeDefined();
    expect(typeof colorFromId(-1)).toBe('string');
    expect(colorFromId(-100)).toBeDefined();
    expect(colorFromId(0)).toBeDefined();
    expect(colorFromId(42)).toBeDefined();

    // strings with various characters
    const testStrings = [
      '',
      'course_123',
      'course_\uFFFF\uFFFF\uFFFF',
      'abc',
      'special!@#$%^&*()',
    ];
    for (const str of testStrings) {
      const color = colorFromId(str);
      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
      expect(color.startsWith('#')).toBe(true);
    }
  });
});

describe('fmtDateSince', () => {
  test('returns just now for recent dates under 1 minute', () => {
    const now = new Date().toISOString();
    expect(fmtDateSince(now)).toBe('just now');

    const thirtySecAgo = new Date(Date.now() - 30 * 1000).toISOString();
    expect(fmtDateSince(thirtySecAgo)).toBe('just now');
  });

  test('returns minutes/hours/days for older dates', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(fmtDateSince(fiveMinAgo)).toBe('5 mins ago');

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(fmtDateSince(oneHourAgo)).toBe('1 hour ago');
  });
});

describe('customTask & customOverride safe storage handling', () => {
  let fakeStorage: Record<string, any> = {};

  beforeEach(() => {
    fakeStorage = {};
    (chrome.storage.local.get as any).callsFake(
      (keys: string | string[] | Record<string, any>) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: fakeStorage[keys] });
        }
        if (Array.isArray(keys)) {
          const res: Record<string, any> = {};
          for (const k of keys) res[k] = fakeStorage[k];
          return Promise.resolve(res);
        }
        return Promise.resolve(fakeStorage);
      }
    );
    (chrome.storage.local.set as any).callsFake(
      (items: Record<string, any>) => {
        Object.assign(fakeStorage, items);
        return Promise.resolve();
      }
    );
  });

  test('deleteCustomTask safely handles missing storage keys without throwing', async () => {
    await expect(
      deleteCustomTask('nonexistent_platform', 'task_123')
    ).resolves.not.toThrow();
  });

  test('setCustomOverride DELETED deletes from the specified platformKey', async () => {
    fakeStorage['blackboard_custom_overrides'] = {
      task_1_101: AssignmentStatus.COMPLETE,
    };
    fakeStorage['blackboard_custom_task'] = {
      task_1: { name: 'Test', due_at: new Date().toISOString() },
    };

    await setCustomOverride(
      'task_1',
      '101',
      'blackboard_custom',
      AssignmentStatus.DELETED
    );

    expect(fakeStorage['blackboard_custom_task']['task_1']).toBeUndefined();
    expect(
      fakeStorage['blackboard_custom_overrides']['task_1_101']
    ).toBeUndefined();
  });
});
