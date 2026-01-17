/**
 * Supabase Connection Test
 * Run this to test if Supabase is configured correctly
 */

import { supabase } from './src/lib/supabase';

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  // Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('❌ Environment variables missing!');
    console.log('   VITE_SUPABASE_URL:', url || 'MISSING');
    console.log('   VITE_SUPABASE_ANON_KEY:', key ? 'Present' : 'MISSING');
    return;
  }
  console.log('✅ Environment variables found');
  console.log('   URL:', url);
  console.log('   Key:', key.substring(0, 20) + '...\n');

  // Test connection with a simple query
  console.log('2️⃣ Testing database connection...');
  try {
    const { data, error } = await supabase
      .from('detections')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed!');
      console.error('   Error:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('\n💡 Solution: You need to run the SQL schema!');
        console.log('   1. Go to: https://rlvgephkagtejlogudqo.supabase.co');
        console.log('   2. Click SQL Editor');
        console.log('   3. Copy contents of supabase-schema.sql');
        console.log('   4. Paste and click Run');
      }
      return;
    }
    
    console.log('✅ Database connection successful!\n');
    
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return;
  }

  // Test insert
  console.log('3️⃣ Testing data insert...');
  try {
    const testRecord = {
      type: 'abnormal_motion',
      confidence: 0.75,
      timestamp: Date.now(),
      features: {
        magnitude: 10.0,
        peakAcceleration: 15.0,
        averageAcceleration: 8.0,
        jerk: 50.0,
        rotationMagnitude: 200.0,
        variance: 5.0
      },
      device_info: 'Test Script'
    };

    const { data, error } = await supabase
      .from('detections')
      .insert(testRecord)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert failed!');
      console.error('   Error:', error.message);
      console.error('   Details:', error.details);
      console.error('   Code:', error.code);
      
      if (error.code === '42501') {
        console.log('\n💡 Solution: RLS policies issue!');
        console.log('   Make sure you ran the FULL SQL schema including policies');
      }
      return;
    }

    console.log('✅ Insert successful!');
    console.log('   Record ID:', data.id);
    console.log('   Type:', data.type);
    console.log('   Confidence:', data.confidence);
    
    // Clean up test record
    await supabase.from('detections').delete().eq('id', data.id);
    console.log('✅ Test record cleaned up\n');
    
  } catch (err) {
    console.error('❌ Insert test failed:', err);
    return;
  }

  console.log('🎉 All tests passed! Supabase is configured correctly!\n');
}

testConnection();
