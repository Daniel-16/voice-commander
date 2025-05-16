import logging
from typing import Dict, Optional
from playwright.async_api import async_playwright

logger = logging.getLogger("external_services.browser")

class BrowserService:
    def __init__(self):
        self._playwright = None
        self._browser = None
        self._context = None
        self._page = None
    
    async def initialize(self):
        if self._playwright is None:
            logger.info("Initializing Playwright browser service")
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(headless=True)
            self._context = await self._browser.new_context()
            self._page = await self._context.new_page()
            logger.info("Browser service initialized")
    
    async def navigate(self, url: str) -> bool:
        logger.info(f"Navigating to {url}")
        await self.initialize()
        try:
            await self._page.goto(url)
            return True
        except Exception as e:
            logger.error(f"Failed to navigate to {url}: {str(e)}")
            return False
    
    async def fill_form(self, form_data: Dict[str, str], selectors: Optional[Dict[str, str]] = None) -> bool:
        await self.initialize()
        try:
            for field, value in form_data.items():
                selector = selectors.get(field, f'[name="{field}"]') if selectors else f'[name="{field}"]'
                await self._page.fill(selector, value)
            return True
        except Exception as e:
            logger.error(f"Failed to fill form: {str(e)}")
            return False
    
    async def click_element(self, selector: str) -> bool:
        await self.initialize()
        try:
            await self._page.click(selector)
            return True
        except Exception as e:
            logger.error(f"Failed to click element {selector}: {str(e)}")
            return False
    
    async def close(self):
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        self._browser = None
        self._context = None
        self._page = None
        self._playwright = None
        logger.info("Browser service closed") 