import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://sfivaxkutmgonhwjfqtx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXZheGt1dG1nb25od2pmcXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDU2OTAsImV4cCI6MjA4ODM4MTY5MH0.G2DcZk4zKb8qvtStR8KHKhreeeBExL5T-Ma2DXeZvjo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
