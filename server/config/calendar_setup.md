# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration with Alris server.

## Step 1: Create a Google Apps Script

1. Open [Google Apps Script](https://script.google.com/home) and create a new project.
2. Replace the default code with the following script:

```javascript
function doPost(e) {
  try {
    // Parse the incoming request data
    const data = JSON.parse(e.postData.contents);

    // Check required parameters
    if (!data.title || !data.startTime || !data.endTime) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: "Missing required parameters (title, startTime, endTime)",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Parse dates from ISO strings (YYYY-MM-DDTHH:MM:SS)
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Create calendar event
    const calendarId = "primary"; // Use 'primary' for the default calendar
    const calendar = CalendarApp.getCalendarById(calendarId);

    const event = calendar.createEvent(data.title, startTime, endTime, {
      description: data.description || "",
      location: data.location || "",
      guests: data.guests || "",
    });

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "Event created successfully",
        eventId: event.getId(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: "Error: " + error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Step 2: Deploy the Web App

1. Click on the "Deploy" button in Google Apps Script editor.
2. Select "New deployment".
3. Set the following options:

   - Type: Web app
   - Description: Alris Calendar Integration
   - Execute as: Me (your Google account)
   - Who has access: Anyone (if you want it publicly accessible) or Anyone within [your organization]

4. Click "Deploy" and authorize the app when prompted.
5. Copy the Web App URL provided after deployment.

## Step 3: Configure Alris Server

1. Add the Web App URL to your `.env` file:

```
GOOGLE_APPS_SCRIPT_CALENDAR_URL=https://script.google.com/macros/s/your-unique-deployment-id/exec
```

2. Restart the Alris server for the changes to take effect.

## Testing the Integration

You can test the calendar integration by sending commands like:

- "Schedule a meeting for tomorrow at 3pm"
- "Create an event called Team Standup for today at 9am"
- "Add a calendar appointment titled Doctor visit for Friday at 2:30pm"

## Troubleshooting

If you encounter issues:

1. Check the Alris server logs for detailed error messages.
2. Verify that the Apps Script URL is correctly set in the environment variables.
3. Make sure your Google account has permission to create events in the specified calendar.
4. Check that the dates being passed to the Apps Script are properly formatted (ISO format: YYYY-MM-DDTHH:MM:SS).
