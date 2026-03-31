import { test } from 'node:test';
import assert from 'node:assert';
import { renderToString } from 'react-dom/server';
import { SubjectCard } from './SubjectCard';

test('SubjectCard renders without crashing and displays correct info', () => {
  const subject = {
    name: 'Mathematics',
    code: 'MATH101',
    total: '85/100',
    graph: [
      { name: 'CT1', val: 10, max: 15 },
      { name: 'CT2', val: 12, max: 15 },
    ]
  };

  const html = renderToString(<SubjectCard subject={subject} />);
  assert.ok(html.includes('Mathematics'));
  assert.ok(html.includes('MATH101'));
  assert.ok(html.includes('85'));
  assert.ok(html.includes('100'));
});

test('SubjectCard handles empty graph gracefully', () => {
  const subject = {
    name: 'Physics',
    code: 'PHYS101',
    total: '0/100',
    graph: []
  };

  const html = renderToString(<SubjectCard subject={subject} />);
  assert.ok(html.includes('Physics'));
  assert.ok(html.includes('PHYS101'));
});

test('SubjectCard derives max value when missing', () => {
  const subject = {
    name: 'Chemistry',
    code: 'CHEM101',
    total: '50/100',
    graph: [
      { name: 'CT1', val: 10 }, // Missing max, should be derived as 15
      { name: 'FT1', val: 12 }, // Missing max, should be derived as 15
    ] as any
  };

  const html = renderToString(<SubjectCard subject={subject} />);
  assert.ok(html.includes('Chemistry'));
});
