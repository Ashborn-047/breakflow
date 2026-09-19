use spacetimedb::{reducer, table, ReducerContext};

pub const DAILY_CAP_SECONDS: u32 = 3600;
pub const MAX_CONCURRENT_PER_SHIFT: u8 = 2;

#[table(name = shift, public)]
#[derive(Clone, Debug)]
pub struct Shift {
    #[primary_key]
    pub id: String,
    pub name: String,
    pub hours: String,
    pub start_hour: u8,
    pub end_hour: u8,
    pub max_concurrent: u8,
}

#[table(name = employee, public)]
#[derive(Clone, Debug)]
pub struct Employee {
    #[primary_key]
    pub id: String,
    pub name: String,
    pub active_shift_id: Option<String>,
    pub daily_used_seconds: u32,
    pub active_break_start_ms: Option<u64>,
}

#[table(name = break_log, public)]
#[derive(Clone, Debug)]
pub struct BreakLog {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub employee_id: String,
    pub employee_name: String,
    pub shift_id: String,
    pub shift_name: String,
    pub start_time_ms: u64,
    pub end_time_ms: u64,
    pub duration_seconds: u32,
}

#[table(name = config, public)]
#[derive(Clone, Debug)]
pub struct Config {
    #[primary_key]
    pub key: String,
    pub value: String,
}

/// Initialize the database with default shifts and placeholder employees if empty
#[reducer(init)]
pub fn init(_ctx: &ReducerContext) -> Result<(), String> {
    // Seed default shifts
    if Shift::iter().count() == 0 {
        Shift::insert(Shift {
            id: "s1".to_string(),
            name: "Morning shift".to_string(),
            hours: "06:00 – 16:00".to_string(),
            start_hour: 6,
            end_hour: 16,
            max_concurrent: MAX_CONCURRENT_PER_SHIFT,
        })?;

        Shift::insert(Shift {
            id: "s2".to_string(),
            name: "Afternoon shift".to_string(),
            hours: "14:00 – 00:00".to_string(),
            start_hour: 14,
            end_hour: 0,
            max_concurrent: MAX_CONCURRENT_PER_SHIFT,
        })?;

        Shift::insert(Shift {
            id: "s3".to_string(),
            name: "Night shift".to_string(),
            hours: "22:00 – 08:00".to_string(),
            start_hour: 22,
            end_hour: 8,
            max_concurrent: MAX_CONCURRENT_PER_SHIFT,
        })?;
    }

    // Seed team members if empty (Employee 01 through Employee 24)
    if Employee::iter().count() == 0 {
        for i in 1..=24 {
            Employee::insert(Employee {
                id: format!("emp_{:02}", i),
                name: format!("Employee {:02}", i),
                active_shift_id: None,
                daily_used_seconds: 0,
                active_break_start_ms: None,
            })?;
        }
    }

    Ok(())
}

/// Start an employee's break under a chosen dynamic shift
#[reducer]
pub fn start_break(ctx: &ReducerContext, employee_id: String, shift_id: String) -> Result<(), String> {
    let emp = Employee::filter_by_id(&employee_id)
        .ok_or_else(|| format!("Employee {} not found", employee_id))?;

    if emp.active_break_start_ms.is_some() {
        return Err("Employee is already on break".to_string());
    }

    if emp.daily_used_seconds >= DAILY_CAP_SECONDS {
        return Err("Daily break allowance (60 minutes) already exhausted".to_string());
    }

    let shift = Shift::filter_by_id(&shift_id)
        .ok_or_else(|| format!("Shift {} not found", shift_id))?;

    // Check concurrency limit in this shift
    let current_shift_breaks = Employee::iter()
        .filter(|e| e.active_shift_id.as_deref() == Some(&shift_id) && e.active_break_start_ms.is_some())
        .count();

    if current_shift_breaks >= shift.max_concurrent as usize {
        return Err(format!("Shift {} break capacity is full ({}/{} active)", shift.name, current_shift_breaks, shift.max_concurrent));
    }

    let now_ms = ctx.timestamp.to_duration_since_epoch().as_millis() as u64;

    Employee::update_by_id(&employee_id, Employee {
        active_shift_id: Some(shift_id),
        active_break_start_ms: Some(now_ms),
        ..emp
    });

    Ok(())
}

/// End an employee's active break and record history
#[reducer]
pub fn end_break(ctx: &ReducerContext, employee_id: String) -> Result<(), String> {
    let emp = Employee::filter_by_id(&employee_id)
        .ok_or_else(|| format!("Employee {} not found", employee_id))?;

    let start_ms = emp.active_break_start_ms
        .ok_or_else(|| "Employee is not currently on break".to_string())?;

    let shift_id = emp.active_shift_id.clone().unwrap_or_else(|| "s1".to_string());
    let shift = Shift::filter_by_id(&shift_id);
    let shift_name = shift.map(|s| s.name).unwrap_or_else(|| "Shift".to_string());

    let now_ms = ctx.timestamp.to_duration_since_epoch().as_millis() as u64;
    let elapsed_sec = if now_ms > start_ms {
        ((now_ms - start_ms) / 1000) as u32
    } else {
        0
    };

    let new_used = emp.daily_used_seconds.saturating_add(elapsed_sec);

    // Save break log record
    BreakLog::insert(BreakLog {
        id: 0, // Auto-incremented
        employee_id: emp.id.clone(),
        employee_name: emp.name.clone(),
        shift_id,
        shift_name,
        start_time_ms: start_ms,
        end_time_ms: now_ms,
        duration_seconds: elapsed_sec,
    })?;

    // Update employee state
    Employee::update_by_id(&employee_id, Employee {
        daily_used_seconds: new_used,
        active_break_start_ms: None,
        active_shift_id: None,
        ..emp
    });

    Ok(())
}

/// Register a new employee in the pool
#[reducer]
pub fn register_employee(_ctx: &ReducerContext, id: String, name: String) -> Result<(), String> {
    if Employee::filter_by_id(&id).is_some() {
        return Err("Employee ID already exists".to_string());
    }

    Employee::insert(Employee {
        id,
        name,
        active_shift_id: None,
        daily_used_seconds: 0,
        active_break_start_ms: None,
    })?;

    Ok(())
}

/// Remove an employee from the roster
#[reducer]
pub fn remove_employee(_ctx: &ReducerContext, employee_id: String) -> Result<(), String> {
    Employee::delete_by_id(&employee_id);
    Ok(())
}

/// Reset all active timers and day usage for a new shift cycle / day
#[reducer]
pub fn reset_day(_ctx: &ReducerContext) -> Result<(), String> {
    for emp in Employee::iter() {
        Employee::update_by_id(&emp.id, Employee {
            active_shift_id: None,
            daily_used_seconds: 0,
            active_break_start_ms: None,
            ..emp
        });
    }
    Ok(())
}
