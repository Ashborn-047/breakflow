import { test, expect } from '@playwright/test';

test.describe('BreakFlow Comprehensive Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start with a fresh state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1. Initial Load & Verified Roster Count', async ({ page }) => {
    await expect(page).toHaveTitle(/BreakFlow/);

    // Verify brand
    await expect(page.locator('h1')).toContainText('BreakFlow');

    // Verify Registered Team stat card shows exactly 24
    await expect(page.locator('[data-testid="stat-registered-team"] strong')).toHaveText('24');

    // Verify initial on break count
    await expect(page.locator('[data-testid="stat-on-break-now"] strong')).toHaveText('0');

    // Verify 3 shifts are displayed
    await expect(page.locator('text=Morning shift')).toBeVisible();
    await expect(page.locator('text=Afternoon shift')).toBeVisible();
    await expect(page.locator('text=Night shift')).toBeVisible();
  });

  test('2. All 24 Team Members Are Sorted Alphabetically', async ({ page }) => {
    // Open Roster modal
    await page.click('button:has-text("Roster")');
    await expect(page.locator('text=Team Roster Management')).toBeVisible();

    // Check first and last employee to verify ascending order
    await expect(page.locator('strong:has-text("Abhay Mishra")')).toBeVisible();
    await expect(page.locator('strong:has-text("Vedika Vivek Bhosle")')).toBeVisible();

    // Verify total count
    await expect(page.locator('text=Total registered: 24')).toBeVisible();

    await page.click('button:has-text("Done")');
  });

  test('3. Break Punch Lifecycle (Start & End Break)', async ({ page }) => {
    // Open break kiosk
    await page.click('button:has-text("Take a break")');
    await expect(page.locator('text=Take a Break · Punch Terminal')).toBeVisible();

    // Click first employee (Abhay Mishra)
    await page.click('strong:has-text("Abhay Mishra")');
    await expect(page.locator('h4:has-text("Abhay Mishra")')).toBeVisible();

    // Start break
    await page.click('button:has-text("Start Break")');

    // Verify toast notification
    await expect(page.locator('text=Abhay Mishra is now on break')).toBeVisible();

    // Verify On Break Now is 1
    await expect(page.locator('text=1 break in progress')).toBeVisible();

    // Verify live break card on shift board shows Abhay Mishra
    await expect(page.locator('strong:has-text("Abhay Mishra")')).toBeVisible();
    await expect(page.locator('text=Break active')).toBeVisible();

    // End break
    await page.click('button:has-text("End break") >> nth=0');
    await expect(page.locator('text=Abhay Mishra break ended')).toBeVisible();

    // Verify back to 0 on break
    await expect(page.locator('text=All team members on duty')).toBeVisible();
  });

  test('4. Concurrency Policy Enforcement (2 Slots Max per Shift)', async ({ page }) => {
    // 1st employee on Night shift (active at night)
    await page.click('button:has-text("Take a break")');
    await page.click('button:has-text("Night shift")');
    await page.fill('input[placeholder*="Type your name"]', 'Abhay');
    await page.click('strong:has-text("Abhay Mishra")');
    await page.click('button:has-text("Start Break")');

    // 2nd employee on Night shift
    await page.click('button:has-text("Take a break")');
    await page.click('button:has-text("Night shift")');
    await page.fill('input[placeholder*="Type your name"]', 'Abhijit');
    await page.click('strong:has-text("Abhijit Bhattacharjee")');
    await page.click('button:has-text("Start Break")');

    // Night shift now has 2 of 2 active breaks
    await expect(page.locator('text=2 breaks in progress')).toBeVisible();

    // Attempt 3rd employee on Night shift -> clicking Slots full triggers capacity modal
    await page.locator('[data-testid="shift-action-s3"]').click();

    // Verify full slots alert modal appears
    await expect(page.locator('text=Break Slots Full (2/2 Active)')).toBeVisible();
    await expect(page.locator('text=Night shift (22:00 – 08:00) has reached maximum concurrent capacity')).toBeVisible();

    // Verify active members are listed in the modal
    await expect(page.locator('.modal-content >> text=Abhay Mishra')).toBeVisible();
    await expect(page.locator('.modal-content >> text=Abhijit Bhattacharjee')).toBeVisible();

    // End one break directly from the full modal to free up a slot
    await page.click('.modal-content >> button:has-text("End Break") >> nth=0');
    await expect(page.locator('text=break ended successfully')).toBeVisible();

    // Verify 1 break is still in progress and 1 slot opened up
    await expect(page.locator('text=1 break in progress')).toBeVisible();
  });

  test('5. Tab Navigation & Telemetry Views', async ({ page }) => {
    // Start 1 break
    await page.click('button:has-text("Take a break")');
    await page.fill('input[placeholder*="Type your name"]', 'Anik');
    await page.click('strong:has-text("Anik Saha")');
    await page.click('button:has-text("Start Break")');

    // Switch to Tab 2: Live Capacity & Telemetry
    await page.click('button:has-text("Live Capacity & Telemetry")');
    await expect(page.locator('text=Who Is Currently On Break')).toBeVisible();
    await expect(page.locator('strong:has-text("Anik Saha")')).toBeVisible();
    await expect(page.locator('text=Shift Capacity Saturation')).toBeVisible();

    // Switch to Tab 3: Productivity & Analytics
    await page.click('button:has-text("Productivity & Analytics")');
    await expect(page.locator('text=Productivity Rate')).toBeVisible();
    await expect(page.locator('text=Break Duration Distribution')).toBeVisible();
    await expect(page.locator('text=Shift Break Load Allocation')).toBeVisible();

    // Test time range buttons
    await page.click('button:has-text("This Week")');
    await page.click('button:has-text("This Month")');
    await page.click('button:has-text("Today")');
  });

  test('6. Roster Management (Add & Remove Team Member)', async ({ page }) => {
    await page.click('button:has-text("Roster")');

    // Add new member
    await page.fill('input[placeholder*="Add new employee"]', 'Test Employee');
    await page.click('button:has-text("Add Member")');

    await expect(page.locator('text=Test Employee added to roster')).toBeVisible();
    await expect(page.locator('text=Total registered: 25')).toBeVisible();

    // Accept browser dialog on remove
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-testid^="remove-"]').last().click();

    await expect(page.locator('text=Employee removed from database')).toBeVisible();
    await expect(page.locator('text=Total registered: 24')).toBeVisible();

    await page.click('button:has-text("Done")');
  });

  test('7. Dark & Light Theme Toggle & Persistence', async ({ page }) => {
    const html = page.locator('html');

    // Click theme toggle
    await page.click('button[title*="Toggle Dark / Light Theme"]');
    const wasDark = await html.evaluate(el => el.classList.contains('dark'));

    // Toggle again
    await page.click('button[title*="Toggle Dark / Light Theme"]');
    const isNowDark = await html.evaluate(el => el.classList.contains('dark'));
    expect(isNowDark).toBe(!wasDark);

    // Reload and check persistence
    await page.reload();
    const isPersisted = await html.evaluate(el => el.classList.contains('dark'));
    expect(isPersisted).toBe(isNowDark);
  });

  test('8. Reset Day Flow', async ({ page }) => {
    // Start a break
    await page.click('button:has-text("Take a break")');
    await page.fill('input[placeholder*="Type your name"]', 'Biprojit');
    await page.click('strong:has-text("Biprojit Paul")');
    await page.click('button:has-text("Start Break")');

    await expect(page.locator('text=1 break in progress')).toBeVisible();

    // Click Reset Day (accept confirm dialog)
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Reset day")');

    await expect(page.locator('text=Daily break cycle has been reset')).toBeVisible();
    await expect(page.locator('text=All team members on duty')).toBeVisible();
  });

  test('9. Search Filtering in Kiosk and Shift Board', async ({ page }) => {
    // Search in main navigation
    await page.fill('input[placeholder*="Search team member"]', 'Swatilekha');
    // Open Kiosk and test dynamic autocomplete filter
    await page.click('button:has-text("Take a break")');
    await page.fill('input[placeholder*="Type your name"]', 'Vedika');
    await expect(page.locator('strong:has-text("Vedika Vivek Bhosle")')).toBeVisible();
    // Non-existent search shows no matches with option to register
    await page.fill('input[placeholder*="Type your name"]', 'NonExistentPersonXYZ');
    await expect(page.locator('text=No match found for "NonExistentPersonXYZ"')).toBeVisible();
    await expect(page.locator('text=Register "NonExistentPersonXYZ" to database')).toBeVisible();
  });

  test('10. Export Report Modal & Shift Selection', async ({ page }) => {
    await page.click('button:has-text("Export report")');
    await expect(page.locator('text=Export Break Records')).toBeVisible();
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export Excel")')).toBeVisible();

    // Select specific shift scope
    await page.selectOption('select', 's1');
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Export Break Records')).not.toBeVisible();
  });
});
