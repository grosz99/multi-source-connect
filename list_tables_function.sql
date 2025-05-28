-- Function to list all tables in the public schema
CREATE OR REPLACE FUNCTION list_tables()
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
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tables.table_name) AS row_count
  FROM 
    information_schema.tables tables
  WHERE 
    table_schema = 'public' AND
    table_type = 'BASE TABLE';
END;
$$;
