from playwright.async_api import async_playwright
from .models import BrowserAction
# import asyncio

class BrowserController:
    def __init__(self):
        self._browser = None
        self._context = None
        self._page = None
        self._initialized = False
        self._playwright = None

    async def _ensure_browser(self):
        if not self._initialized:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(headless=False)
            self._context = await self._browser.new_context()
            self._page = await self._context.new_page()
            self._initialized = True

    async def navigate(self, url: str) -> bool:
        """Navigate to a specified URL."""
        try:
            await self._ensure_browser()
            await self._page.goto(url, wait_until="networkidle")
            return True
        except Exception as e:
            print(f"Navigation failed: {str(e)}")
            return False

    async def fill_form(self, form_data: dict, selectors: dict = None) -> bool:
        """Fill form fields with the provided data."""
        try:
            await self._ensure_browser()
            for field, value in form_data.items():
                selector = selectors.get(field) if selectors else f'input[name="{field}"]'
                await self._page.fill(selector, value)
            return True
        except Exception as e:
            print(f"Form fill failed: {str(e)}")
            return False

    async def click_element(self, selector: str) -> bool:
        """Click an element on the page."""
        try:
            await self._ensure_browser()
            await self._page.click(selector)
            return True
        except Exception as e:
            print(f"Click failed: {str(e)}")
            return False

    async def execute_action(self, action: BrowserAction) -> bool:
        try:
            await self._ensure_browser()

            if action.url:
                await self._page.goto(action.url)
                await self._page.wait_for_load_state("networkidle")

            if action.action == "play_video":                
                if "youtube.com" in action.url:
                    search_input = await self._page.wait_for_selector('input#search')
                    await search_input.fill(action.inputs.get("search", ""))
                    await search_input.press("Enter")
                    await self._page.wait_for_load_state("networkidle")
                    
                    await self._page.wait_for_selector("ytd-video-renderer")
                    await self._page.click("ytd-video-renderer")

            elif action.action == "fill_form":
                for field, value in (action.inputs or {}).items():
                    selector = action.selectors.get(field) if action.selectors else f'input[name="{field}"]'
                    await self._page.fill(selector, value)

            elif action.action == "click":
                selector = action.selectors.get("click") if action.selectors else action.parameters.get("selector")
                if selector:
                    await self._page.click(selector)

            return True

        except Exception as e:
            print(f"Browser action failed: {str(e)}")
            return False

    async def cleanup(self):
        """Properly cleanup all browser resources."""
        if self._initialized:
            try:
                if self._page:
                    await self._page.close()
                if self._context:
                    await self._context.close()
                if self._browser:
                    await self._browser.close()
                if self._playwright:
                    await self._playwright.stop()
            except Exception as e:
                print(f"Cleanup failed: {str(e)}")
            finally:
                self._initialized = False
                self._page = None
                self._context = None
                self._browser = None
                self._playwright = None 