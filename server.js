require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Root endpoint with API documentation for OpenAI
app.get('/', (req, res) => {
  res.json({
    message: 'Supabase-ChatGPT API Bridge',
    description: 'API for connecting ChatGPT to Supabase databases',
    endpoints: {
      '/api/tables': 'GET - List all tables',
      '/api/query': 'POST - Query table data',
      '/.well-known/ai-plugin.json': 'GET - OpenAI plugin manifest'
    }
  });
});

// OpenAI Plugin manifest
app.get('/.well-known/ai-plugin.json', (req, res) => {
  const host = req.headers.host;
  const protocol = req.protocol;
  
  res.json({
    schema_version: 'v1',
    name_for_human: 'Supabase Data Explorer',
    name_for_model: 'supabase_data_explorer',
    description_for_human: 'Explore and query your Supabase database tables.',
    description_for_model: 'Plugin for querying and exploring Supabase database tables. Use this when the user wants to analyze or retrieve data from their Supabase database.',
    auth: {
      type: 'none'
    },
    api: {
      type: 'openapi',
      url: `${protocol}://${host}/openapi.yaml`
    },
    logo_url: `${protocol}://${host}/logo.png`,
    contact_email: 'support@example.com',
    legal_info_url: 'https://example.com/legal'
  });
});

// OpenAPI specification
app.get('/openapi.yaml', (req, res) => {
  const host = req.headers.host;
  res.setHeader('Content-Type', 'text/yaml');
  res.send(`
openapi: 3.1.0
info:
  title: Supabase Data Explorer API
  description: API for exploring and querying Supabase database tables
  version: 'v1'
servers:
  - url: https://${host}
paths:
  /api/tables:
    get:
      operationId: listTables
      summary: List all tables in the Supabase database
      responses:
        '200':
          description: List of tables
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    table_name:
                      type: string
                    row_count:
                      type: integer
  /api/shopping:
    get:
      operationId: getShoppingData
      summary: Get data from the Shopping table
      parameters:
        - name: limit
          in: query
          description: Maximum number of records to return
          schema:
            type: integer
            default: 100
        - name: offset
          in: query
          description: Number of records to skip
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Shopping data
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
  /api/shopping/schema:
    get:
      operationId: getShoppingSchema
      summary: Get schema information for the Shopping table
      responses:
        '200':
          description: Shopping table schema
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    column_name:
                      type: string
                    data_type:
                      type: string
                    is_nullable:
                      type: boolean
  /api/house_prices:
    get:
      operationId: getHousePricesData
      summary: Get data from the HOUSE_PRICES table
      parameters:
        - name: limit
          in: query
          description: Maximum number of records to return
          schema:
            type: integer
            default: 100
        - name: offset
          in: query
          description: Number of records to skip
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: House prices data
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
  /api/house_prices/schema:
    get:
      operationId: getHousePricesSchema
      summary: Get schema information for the HOUSE_PRICES table
      responses:
        '200':
          description: House prices table schema
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    column_name:
                      type: string
                    data_type:
                      type: string
                    is_nullable:
                      type: boolean
  /api/query:
    post:
      operationId: queryTable
      summary: Query a specific table with filters
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - tableName
              properties:
                tableName:
                  type: string
                  description: Name of the table to query
                columns:
                  type: string
                  description: Comma-separated list of columns to select (defaults to *)
                filters:
                  type: array
                  description: Filters to apply to the query
                  items:
                    type: object
                    required:
                      - column
                      - operator
                      - value
                    properties:
                      column:
                        type: string
                        description: Column name to filter on
                      operator:
                        type: string
                        description: Operator to use (eq, neq, gt, gte, lt, lte, like, ilike)
                      value:
                        type: string
                        description: Value to compare against
                limit:
                  type: integer
                  description: Maximum number of rows to return (defaults to 100)
      responses:
        '200':
          description: Query results
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
  `);
});

// Serve the logo
app.get('/logo.png', (req, res) => {
  try {
    res.sendFile(__dirname + '/logo.png');
  } catch (error) {
    console.error('Error serving logo:', error);
    res.status(404).send('Logo not found');
  }
});

// API Endpoints
app.get('/api/tables', async (req, res) => {
  try {
    // Hardcode the tables we know exist
    const tables = [
      {
        table_name: 'Shopping',
        row_count: 9994
      },
      {
        table_name: 'HOUSE_PRICES',
        row_count: 27412
      }
    ];
    
    res.json(tables);
  } catch (error) {
    console.error('Exception when fetching tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Query data from a specific table
app.post('/api/query', async (req, res) => {
  try {
    const { tableName, columns, filters, limit } = req.body;
    
    // Validate required fields
    if (!tableName) {
      return res.status(400).json({ error: 'tableName is required' });
    }

    let query = supabase.from(tableName).select(columns || '*');
    
    // Apply filters if provided
    if (filters && Array.isArray(filters)) {
      filters.forEach(filter => {
        if (filter.column && filter.operator && filter.value !== undefined) {
          switch (filter.operator) {
            case 'eq':
              query = query.eq(filter.column, filter.value);
              break;
            case 'neq':
              query = query.neq(filter.column, filter.value);
              break;
            case 'gt':
              query = query.gt(filter.column, filter.value);
              break;
            case 'gte':
              query = query.gte(filter.column, filter.value);
              break;
            case 'lt':
              query = query.lt(filter.column, filter.value);
              break;
            case 'lte':
              query = query.lte(filter.column, filter.value);
              break;
            case 'like':
              query = query.like(filter.column, `%${filter.value}%`);
              break;
            case 'ilike':
              query = query.ilike(filter.column, `%${filter.value}%`);
              break;
          }
        }
      });
    }
    
    // Apply limit if provided
    if (limit && !isNaN(parseInt(limit))) {
      query = query.limit(parseInt(limit));
    } else {
      // Default limit to prevent large data transfers
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error querying ${tableName}:`, error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Exception when querying:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Shopping table data
app.get('/api/shopping', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('Shopping')
      .select('*')
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching shopping data:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Exception when fetching shopping data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Shopping table schema
app.get('/api/shopping/schema', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'Shopping')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Error fetching shopping schema:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Exception when fetching shopping schema:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get HOUSE_PRICES table data
app.get('/api/house_prices', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('HOUSE_PRICES')
      .select('*')
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching house prices data:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Exception when fetching house prices data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get HOUSE_PRICES table schema
app.get('/api/house_prices/schema', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'HOUSE_PRICES')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Error fetching house prices schema:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Exception when fetching house prices schema:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
