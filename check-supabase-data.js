const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rlvgephkagtejlogudqo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdmdlcGhrYWd0ZWpsb2d1ZHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzI0MzgsImV4cCI6MjA4NDIwODQzOH0.mZs84-tEUKc73j0HqCXwaD1FDB-8C6fvvnPRuhPy2oM'
);

async function checkData() {
  console.log('🔍 Checking CHild_safety Supabase database...\n');
  
  // Check alerts
  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log('📊 ALERTS TABLE:');
  console.log(`   Count: ${alerts?.length || 0}`);
  if (alertsError) console.log(`   Error: ${alertsError.message}`);
  if (alerts && alerts.length > 0) {
    console.log(`   Latest: ${JSON.stringify(alerts[0], null, 2)}`);
  }
  
  // Check detections
  const { data: detections, error: detectionsError } = await supabase
    .from('detections')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log('\n📊 DETECTIONS TABLE:');
  console.log(`   Count: ${detections?.length || 0}`);
  if (detectionsError) console.log(`   Error: ${detectionsError.message}`);
  if (detections && detections.length > 0) {
    console.log(`   Latest: ${JSON.stringify(detections[0], null, 2)}`);
  }
}

checkData();
