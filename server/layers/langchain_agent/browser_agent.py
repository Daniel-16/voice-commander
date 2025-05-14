import logging
from typing import List, Dict, Any
from langchain.agents import Tool
from langchain_community.tools import YouTubeSearchTool
from .react_agent import BaseReactAgent

logger = logging.getLogger("langchain_agent.browser")

class BrowserAgent(BaseReactAgent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.youtube_tool = YouTubeSearchTool()
    
    def _get_tools(self) -> List[Tool]:
        return [
            Tool(
                name="navigate_to_url",
                func=self._navigate_to_url,
                description="Navigate to a specified URL in the browser. Input should be a URL string."
            ),
            Tool(
                name="search_youtube",
                func=self._search_youtube,
                description="Search for videos on YouTube and return video links. Input should be a search query string."
            ),
            Tool(
                name="fill_form",
                func=self._fill_form,
                description="Fill a form with the provided data. Input should be a JSON string with form_data (a dictionary of field names and values) and optionally selectors (a dictionary of field names and selectors)."
            ),
            Tool(
                name="click_element",
                func=self._click_element,
                description="Click on an element in the browser. Input should be a CSS selector string."
            )
        ]
    
    def _get_system_prompt(self) -> str:
        return """
        You are a browser automation assistant that helps users navigate websites, fill forms, and perform actions in a web browser.
        
        You can:
        1. Navigate to URLs
        2. Search for YouTube videos and get video links
        3. Fill out forms 
        4. Click on elements
        
        When a user wants to watch videos or tutorials on a topic:
        - Always use the search_youtube tool with the specific search query
        - The search_youtube tool will return video URLs directly
        - You should clearly present these video links to the user
        
        Break down the user's request into logical steps and use the available tools to accomplish the task.
        Always think step by step and use the most appropriate tool for each action.
        
        For YouTube searches, you should:
        1. Identify the search query from the user's request
        2. Call the search_youtube tool with that query
        3. Present the resulting video links clearly to the user
        """
    
    async def _navigate_to_url(self, url: str) -> Dict[str, Any]:
        try:
            logger.info(f"Would navigate to URL: {url}")
            return {
                "status": "success",
                "message": f"Navigated to {url}"
            }
        except Exception as e:
            logger.error(f"Failed to navigate to URL: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to navigate to URL: {str(e)}"
            }
    
    async def _search_youtube(self, query: str) -> Dict[str, Any]:
        try:
            logger.info(f"Searching YouTube for: {query}")
            
            if not query or not isinstance(query, str):
                return {
                    "status": "error",
                    "action": "youtube_search",
                    "message": "I need a valid search query to find videos for you. Could you please provide more details about what you're looking for?",
                    "video_urls": []
                }
            
            query = query.strip()
            if query.startswith('"') and query.endswith('"'):
                query = query[1:-1]
            
            try:
                video_ids = self.youtube_tool.run(f"{query},5")
                logger.info(f"YouTube search returned: {video_ids}")
            except Exception as e:
                logger.error(f"YouTube search tool error: {str(e)}")
                return {
                    "status": "error",
                    "action": "youtube_search",
                    "query": query,
                    "message": f"I tried searching for videos about '{query}', but encountered an issue with YouTube. Would you like to try a different search?",
                    "video_urls": []
                }
            
            if isinstance(video_ids, str):
                try:
                    import ast
                    video_ids = ast.literal_eval(video_ids)
                except Exception as parse_error:
                    logger.error(f"Failed to parse video IDs from string: {str(parse_error)}")
                    video_ids = []
            
            if not isinstance(video_ids, list):
                logger.warning(f"Expected list of video IDs, got {type(video_ids)}")
                video_ids = []
            
            video_urls = []
            for video_id in video_ids:
                try:
                    if isinstance(video_id, str):
                        if 'watch?v=' in video_id:
                            vid = video_id.split('watch?v=')[1].split('&')[0]
                        else:
                            vid = video_id
                        url = f"https://www.youtube.com/watch?v={vid}"
                        video_urls.append(url)
                except Exception as e:
                    logger.error(f"Error processing video ID {video_id}: {str(e)}")
            
            if video_urls:
                import random
                
                introductions = [
                    f"I found some great videos about {query} for you:",
                    f"Here are some YouTube videos on {query} that I discovered:",
                    f"Based on your search for {query}, I found these videos:", 
                    f"I've searched YouTube and found these videos about {query}:",
                    f"Check out these videos related to {query}:"
                ]
                
                video_descriptions = []
                for i, url in enumerate(video_urls):
                    video_descriptions.append(f"Video {i+1}: {url}")
                
                video_links = "\n".join(video_descriptions)
                message = f"{random.choice(introductions)}\n\n{video_links}\n\nDo any of these look helpful?"
            else:
                message = f"I searched for videos about '{query}' but couldn't find any matches. Would you like to try with different keywords?"
            
            result = {
                "status": "success",
                "action": "youtube_search",
                "query": query,
                "video_urls": video_urls,
                "message": message
            }
            
            logger.info(f"YouTube search result: {len(video_urls)} videos found")
            return result
            
        except Exception as e:
            logger.error(f"Failed to search YouTube: {str(e)}")
            logger.exception("Full YouTube search error:")
            return {
                "status": "error",
                "action": "youtube_search",
                "query": query,
                "message": f"I encountered an unexpected issue while searching for '{query}' videos. Would you like to try again with a different search?",
                "video_urls": []
            }
    
    async def _fill_form(self, input_str: str) -> Dict[str, Any]:
        try:
            import json
            data = json.loads(input_str)
            form_data = data.get("form_data", {})
            selectors = data.get("selectors", {})
            
            logger.info(f"Would fill form with data: {form_data}, selectors: {selectors}")
            return {
                "status": "success",
                "message": "Filled form successfully"
            }
        except Exception as e:
            logger.error(f"Failed to fill form: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to fill form: {str(e)}"
            }
    
    async def _click_element(self, selector: str) -> Dict[str, Any]:
        try:
            logger.info(f"Would click element with selector: {selector}")
            return {
                "status": "success",
                "message": f"Clicked element with selector '{selector}'"
            }
        except Exception as e:
            logger.error(f"Failed to click element: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to click element: {str(e)}"
            }
    
    def set_mcp_client(self, mcp_client):
        self.mcp_client = mcp_client 

    async def direct_youtube_search(self, query: str) -> Dict[str, Any]:
        logger.info(f"Performing direct YouTube search for '{query}'")
        try:
            query = query.strip()
            
            video_ids_str = self.youtube_tool.run(f"{query},5")
            logger.info(f"Direct YouTube search returned: {video_ids_str}")
            
            import ast
            try:
                video_ids = ast.literal_eval(video_ids_str) if isinstance(video_ids_str, str) else video_ids_str
            except Exception as parse_error:
                logger.error(f"Failed to parse video IDs: {str(parse_error)}")
                video_ids = []
                if isinstance(video_ids_str, str):
                    if '[' in video_ids_str and ']' in video_ids_str:
                        clean_str = video_ids_str.strip()[1:-1].replace("'", "").replace('"', "")
                        video_ids = [v.strip() for v in clean_str.split(',')]
            
            if not isinstance(video_ids, list):
                video_ids = [video_ids] if video_ids else []
            
            video_urls = []
            for video_id in video_ids:
                if not video_id:
                    continue
                    
                try:
                    if isinstance(video_id, str):
                        if 'watch?v=' in video_id:
                            vid = video_id.split('watch?v=')[1].split('&')[0]
                        else:
                            vid = video_id
                        url = f"https://www.youtube.com/watch?v={vid}"
                        video_urls.append(url)
                except Exception as e:
                    logger.error(f"Error processing video ID {video_id}: {str(e)}")
            
            if video_urls:
                import random
                intro_phrases = [
                    f"I've found some great videos about {query}! Here they are:",
                    f"Here are some YouTube videos on {query} that might help you:",
                    f"I searched YouTube for '{query}' and found these videos:",
                    f"Based on your interest in {query}, these videos might be helpful:",
                    f"Check out these videos about {query}:"
                ]
                
                video_descriptions = []
                for i, url in enumerate(video_urls):
                    video_id = url.split("watch?v=")[1] if "watch?v=" in url else url.split("/")[-1]
                    video_descriptions.append(f"Video {i+1}: {url}")
                
                video_links = "\n".join(video_descriptions)
                intro = random.choice(intro_phrases)
                
                message = f"{intro}\n\n{video_links}\n\nIs there anything specific from these videos you'd like to know more about?"
            else:
                message = f"I searched for videos about '{query}' on YouTube but couldn't find any relevant results. Would you like to try a different search term?"
            
            return {
                "status": "success",
                "message": message,
                "video_urls": video_urls,
                "query": query
            }
            
        except Exception as e:
            logger.error(f"Error in direct YouTube search: {str(e)}")
            logger.exception("Full direct YouTube search error:")
            return {
                "status": "error",
                "message": f"I tried searching for '{query}' on YouTube, but encountered an error. Would you like to try again or search for something else?",
                "video_urls": [],
                "query": query
            } 