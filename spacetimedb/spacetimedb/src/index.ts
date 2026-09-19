import { schema, table, t } from 'spacetimedb/server';

const spacetimedb = schema({
  shift: table(
    { public: true },
    {
      id: t.string().primaryKey(),
      name: t.string(),
      hours: t.string(),
      startHour: t.u8(),
      endHour: t.u8(),
      maxConcurrent: t.u8(),
    }
  ),
  employee: table(
    { public: true },
    {
      id: t.string().primaryKey(),
      name: t.string(),
      activeShiftId: t.string().optional(),
      dailyUsedSeconds: t.u32(),
      activeBreakStartMs: t.u64().optional(),
    }
  ),
  breakLog: table(
    { public: true },
    {
      id: t.u64().primaryKey().autoInc(),
      employeeId: t.string(),
      employeeName: t.string(),
      shiftId: t.string(),
      shiftName: t.string(),
      startMs: t.u64(),
      endMs: t.u64(),
      durationSec: t.u32(),
    }
  ),
});

export default spacetimedb;

export const seedData = spacetimedb.reducer({}, ctx => {
  // Clear any previous sample test records if existing
  for (const emp of ctx.db.employee.iter()) {
    ctx.db.employee.id.delete(emp.id);
  }
  for (const s of ctx.db.shift.iter()) {
    ctx.db.shift.id.delete(s.id);
  }

  // Seed default shifts
  ctx.db.shift.insert({
    id: 's1',
    name: 'Morning shift',
    hours: '06:00 – 16:00',
    startHour: 6,
    endHour: 16,
    maxConcurrent: 2,
  });
  ctx.db.shift.insert({
    id: 's2',
    name: 'Afternoon shift',
    hours: '14:00 – 00:00',
    startHour: 14,
    endHour: 0,
    maxConcurrent: 2,
  });
  ctx.db.shift.insert({
    id: 's3',
    name: 'Night shift',
    hours: '22:00 – 08:00',
    startHour: 22,
    endHour: 8,
    maxConcurrent: 2,
  });

  // Seed 24 employees in ascending order (Employee 01 through Employee 24)
  for (let i = 1; i <= 24; i++) {
    const pad = String(i).padStart(2, '0');
    ctx.db.employee.insert({
      id: `emp_${pad}`,
      name: `Employee ${pad}`,
      activeShiftId: undefined,
      dailyUsedSeconds: 0,
      activeBreakStartMs: undefined,
    });
  }
});

export const init = spacetimedb.init(ctx => {
  // Seed default shifts
  if (ctx.db.shift.count() === 0n) {
    ctx.db.shift.insert({
      id: 's1',
      name: 'Morning shift',
      hours: '06:00 – 16:00',
      startHour: 6,
      endHour: 16,
      maxConcurrent: 2,
    });
    ctx.db.shift.insert({
      id: 's2',
      name: 'Afternoon shift',
      hours: '14:00 – 00:00',
      startHour: 14,
      endHour: 0,
      maxConcurrent: 2,
    });
    ctx.db.shift.insert({
      id: 's3',
      name: 'Night shift',
      hours: '22:00 – 08:00',
      startHour: 22,
      endHour: 8,
      maxConcurrent: 2,
    });
  }

  // Seed default employee roster
  if (ctx.db.employee.count() === 0n) {
    for (let i = 1; i <= 24; i++) {
      const pad = String(i).padStart(2, '0');
      ctx.db.employee.insert({
        id: `emp_${pad}`,
        name: `Employee ${pad}`,
        activeShiftId: undefined,
        dailyUsedSeconds: 0,
        activeBreakStartMs: undefined,
      });
    }
  }
});

export const startBreak = spacetimedb.reducer(
  { employeeId: t.string(), shiftId: t.string() },
  (ctx, { employeeId, shiftId }) => {
    const emp = ctx.db.employee.id.find(employeeId);
    if (!emp) throw new Error(`Employee ${employeeId} not found`);
    if (emp.activeBreakStartMs) throw new Error('Employee is already on break');
    if (emp.dailyUsedSeconds >= 3600) throw new Error('Daily break allowance of 60 minutes already used');

    const shift = ctx.db.shift.id.find(shiftId);
    if (!shift) throw new Error(`Shift ${shiftId} not found`);

    let activeInShift = 0;
    for (const e of ctx.db.employee.iter()) {
      if (e.activeShiftId === shiftId && e.activeBreakStartMs) {
        activeInShift++;
      }
    }
    if (activeInShift >= shift.maxConcurrent) {
      throw new Error(`Shift ${shift.name} break slots are full`);
    }

    const nowMs = BigInt(Date.now());
    ctx.db.employee.id.update({
      ...emp,
      activeShiftId: shiftId,
      activeBreakStartMs: nowMs,
    });
  }
);

export const endBreak = spacetimedb.reducer(
  { employeeId: t.string() },
  (ctx, { employeeId }) => {
    const emp = ctx.db.employee.id.find(employeeId);
    if (!emp) throw new Error(`Employee ${employeeId} not found`);
    if (!emp.activeBreakStartMs) throw new Error('Employee is not on break');

    const nowMs = BigInt(Date.now());
    const startMs = emp.activeBreakStartMs;
    const elapsedSec = Number((nowMs - startMs) / 1000n);
    const newUsed = emp.dailyUsedSeconds + elapsedSec;

    const shiftId = emp.activeShiftId || 's1';
    const shift = ctx.db.shift.id.find(shiftId);
    const shiftName = shift ? shift.name : 'Shift';

    ctx.db.breakLog.insert({
      id: 0n,
      employeeId: emp.id,
      employeeName: emp.name,
      shiftId,
      shiftName,
      startMs,
      endMs: nowMs,
      durationSec: elapsedSec,
    });

    ctx.db.employee.id.update({
      ...emp,
      dailyUsedSeconds: newUsed,
      activeBreakStartMs: undefined,
      activeShiftId: undefined,
    });
  }
);

export const registerEmployee = spacetimedb.reducer(
  { id: t.string(), name: t.string() },
  (ctx, { id, name }) => {
    ctx.db.employee.insert({
      id,
      name,
      activeShiftId: undefined,
      dailyUsedSeconds: 0,
      activeBreakStartMs: undefined,
    });
  }
);

export const removeEmployee = spacetimedb.reducer(
  { employeeId: t.string() },
  (ctx, { employeeId }) => {
    ctx.db.employee.id.delete(employeeId);
  }
);

export const resetDay = spacetimedb.reducer({}, ctx => {
  for (const emp of ctx.db.employee.iter()) {
    ctx.db.employee.id.update({
      ...emp,
      activeShiftId: undefined,
      dailyUsedSeconds: 0,
      activeBreakStartMs: undefined,
    });
  }
});
