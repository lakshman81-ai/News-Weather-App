from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use mobile viewport for better visualization of mobile features
        context = browser.new_context(viewport={'width': 375, 'height': 812})
        page = context.new_page()

        url = "http://localhost:5173/News-Weather-App/#/"
        print(f"Navigating to Main Page at {url}...")
        try:
            page.goto(url, timeout=60000)
        except Exception as e:
            print(f"Error navigating: {e}")
            return

        # Wait for some content to load
        try:
            page.wait_for_selector(".header", timeout=10000)
        except:
            print("Header not found, page might handle error or loading")

        time.sleep(5) # Wait for data load
        page.screenshot(path="verification_main.png")
        print("Captured Main Page")

        # 2. Market Page
        print("Navigating to Market Page...")
        try:
            page.get_by_text("Market", exact=True).click()
            time.sleep(3)
            page.screenshot(path="verification_market.png")
            print("Captured Market Page")
        except Exception as e:
            print(f"Error on Market Page: {e}")

        # 3. Tech/Social Page
        print("Navigating to Tech/Social Page...")
        try:
            page.get_by_text("Tech/Social", exact=True).click()
            time.sleep(3)
            page.screenshot(path="verification_techsocial.png")
            print("Captured Tech/Social Page")
        except Exception as e:
             print(f"Error on Tech/Social Page: {e}")

        # 4. Settings Page
        print("Navigating to Settings Page...")
        try:
            page.get_by_text("Settings", exact=True).click()
            time.sleep(2)
            page.screenshot(path="verification_settings.png")
            print("Captured Settings Page")
        except Exception as e:
             print(f"Error on Settings Page: {e}")

        browser.close()

if __name__ == "__main__":
    run()
