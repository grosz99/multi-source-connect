# Connecting Supabase to ChatGPT with Custom Actions

This guide explains how to connect your Supabase database to ChatGPT using OpenAI's Custom GPT Actions. This modern approach allows ChatGPT to directly query and analyze your Supabase data.

## Project Overview

This project creates an API that serves as a bridge between ChatGPT and your Supabase database. The API follows OpenAI's specifications for Custom GPT Actions, allowing ChatGPT to:

1. List all tables in your Supabase database
2. Query specific tables with filters
3. Analyze the data returned

## Setup Instructions

### 1. Deploy the API to Heroku

1. Make sure you have the Heroku CLI installed
2. Log in to Heroku: `heroku login`
3. Initialize a git repository:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```
4. Link to your existing Heroku app:
   ```
   heroku git:remote -a test-multi-connect
   ```
5. Set your environment variables:
   ```
   heroku config:set SUPABASE_URL=https://dhzeyzmbvghwutfqzyci.supabase.co
   heroku config:set SUPABASE_KEY=your_service_role_key
   ```
6. Deploy to Heroku:
   ```
   git push heroku main
   ```

### 2. Create a Custom GPT with Actions

1. Go to [https://chat.openai.com/gpts/editor](https://chat.openai.com/gpts/editor)
2. Click "Create a GPT"
3. Give your GPT a name and description
4. In the "Configure" tab, scroll down to "Actions"
5. Click "Create new action"
6. For the Schema, enter your Heroku app URL: `https://test-multi-connect.herokuapp.com/openapi.yaml`
7. Name your action "Supabase Data Explorer"
8. Save your action
9. In the GPT instructions, add:
   ```
   You are a data analyst that can query and analyze data from a Supabase database.
   When users ask about data, use the Supabase Data Explorer action to:
   1. List available tables using the listTables operation
   2. Query specific tables using the queryTable operation
   3. Analyze the returned data to answer the user's question
   ```
10. Click "Save" and then "Publish" (or keep private)

## API Endpoints

The API exposes the following endpoints:

### GET /api/tables
Lists all tables in your Supabase database with their row counts.

### POST /api/query
Queries a specific table with optional filters.

Request body:
```json
{
  "tableName": "your_table_name",
  "columns": "id, name, created_at",
  "filters": [
    {
      "column": "status",
      "operator": "eq",
      "value": "active"
    }
  ],
  "limit": 100
}
```

## How It Works

1. When a user asks your Custom GPT about data in your Supabase database, the GPT recognizes this as a data query.
2. The GPT calls the appropriate action (listTables or queryTable) on your Heroku API.
3. Your API connects to Supabase using the stored credentials and executes the query.
4. The results are returned to ChatGPT, which then analyzes and presents them to the user.

## Security Considerations

- This API uses your Supabase service role key, which has full access to your database
- The API is read-only by design, but you should still be careful about exposing it
- Consider adding authentication if you're deploying to production

## Example Usage

User: "What tables are available in the database?"
GPT: *calls listTables action and displays the results*

User: "Show me the top 5 active users"
GPT: *calls queryTable action with appropriate filters and displays the results*
