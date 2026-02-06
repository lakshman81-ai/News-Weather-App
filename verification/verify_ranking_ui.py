from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Go to Settings
        print("Navigating to Settings...")
        page.goto("http://localhost:5173/News-Weather-App/#/settings")
        page.wait_for_load_state("networkidle")

        # 2. Click on Logic & Ranking tab
        print("Clicking Logic tab...")
        page.get_by_role("button", name="Logic & Ranking").click()

        # 3. Verify Scoring Engine section
        print("Verifying Scoring Engine UI...")
        expect(page.get_by_text("Scoring Engine")).to_be_visible()
        expect(page.get_by_text("9-Factor Scoring")).to_be_visible()

        # 4. Change Ranking Mode to Context-Aware
        print("Enabling Context-Aware mode...")
        # Find the select inside the item labeled "Ranking Method"
        ranking_select = page.locator("div.settings-item").filter(has_text="Ranking Method").locator("select")
        ranking_select.select_option("context-aware")

        # 5. Check if Interleave slider appears
        time.sleep(1)
        print("Verifying slider...")
        expect(page.get_by_text("Local News Frequency")).to_be_visible()

        # 6. Save Settings
        print("Saving...")
        page.get_by_role("button", name="Save").click()
        time.sleep(2) # wait for save toast

        # 7. Go to Home
        print("Navigating Home...")
        page.goto("http://localhost:5173/News-Weather-App/#/")
        page.wait_for_load_state("networkidle")
        time.sleep(3) # Wait for header and everything

        # 8. Check for Location Icon
        print("Checking for Location Icon...")
        icon = page.locator("span[title='Location Boost Active']")
        expect(icon).to_be_visible()

    except Exception as e:
        print(f"FAILED: {e}")
    finally:
        # 9. Screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/ranking_ui.png", full_page=True)
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
