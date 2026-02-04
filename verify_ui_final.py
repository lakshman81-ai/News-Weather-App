from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            print("Navigating to Newspaper page...")
            page.goto("http://localhost:5173/#/newspaper")

            # Wait for content to load
            print("Waiting for briefs (ImageCards)...")
            try:
                # Wait up to 30 seconds for the image cards to appear
                # We look for .image-card inside .briefs-list specifically to be sure
                page.wait_for_selector(".briefs-list .image-card", state="visible", timeout=30000)
                print("ImageCards found in Briefs list!")
                # Wait a bit for animations/transforms to settle
                time.sleep(2)
            except Exception as e:
                print(f"Timeout waiting for selector: {e}")

            # Take screenshot
            screenshot_path = os.path.join(os.getcwd(), "verification_final.png")
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
