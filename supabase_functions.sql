-- Function to get all tables in the public schema
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (
  table_name text,
  row_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tables.table_name::text,
    (SELECT reltuples::bigint FROM pg_class WHERE oid = (quote_ident(tables.table_name)::regclass)) AS row_count
  FROM 
    information_schema.tables
  WHERE 
    table_schema = 'public' AND
    table_type = 'BASE TABLE';
END;
$$;

-- Function to get schema information for a specific table
CREATE OR REPLACE FUNCTION get_table_schema(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::text,
    columns.data_type::text,
    columns.is_nullable::boolean,
    columns.column_default::text
  FROM 
    information_schema.columns
  WHERE 
    table_schema = 'public' AND
    columns.table_name = get_table_schema.table_name
  ORDER BY 
    ordinal_position;
END;
$$;

-- Function to get statistics for a specific table
CREATE OR REPLACE FUNCTION get_table_stats(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE format('
    SELECT json_build_object(
      ''row_count'', (SELECT COUNT(*) FROM %I),
      ''created_at_min'', (SELECT MIN(created_at) FROM %I WHERE created_at IS NOT NULL),
      ''created_at_max'', (SELECT MAX(created_at) FROM %I WHERE created_at IS NOT NULL),
      ''updated_at_min'', (SELECT MIN(updated_at) FROM %I WHERE updated_at IS NOT NULL),
      ''updated_at_max'', (SELECT MAX(updated_at) FROM %I WHERE updated_at IS NOT NULL)
    )
  ', table_name, table_name, table_name, table_name, table_name) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- If the table doesn't have created_at or updated_at columns, return just the row count
    BEGIN
      EXECUTE format('
        SELECT json_build_object(
          ''row_count'', (SELECT COUNT(*) FROM %I)
        )
      ', table_name) INTO result;
      
      RETURN result;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
    END;
END;
$$;
