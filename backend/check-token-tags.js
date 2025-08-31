const pool = require('./dist/config/postgres.js').default;

async function checkTokenTags() {
  try {
    console.log('🔍 Checking if blox-myrc token has tags...');
    
    // First, get the token
    const tokenResult = await pool.query('SELECT * FROM tokens WHERE unique_id = $1', ['blox-myrc']);
    if (tokenResult.rows.length === 0) {
      console.log('❌ Token blox-myrc not found');
      return;
    }
    
    const token = tokenResult.rows[0];
    console.log('✅ Found token:', { 
      id: token.id, 
      name: token.name, 
      category: token.category,
      unique_id: token.unique_id 
    });
    
    // Check tags table
    const tagsResult = await pool.query('SELECT * FROM tags LIMIT 10');
    console.log('📋 Available tags in database:', tagsResult.rows);
    
    // Check token_tags junction table
    const tokenTagsResult = await pool.query('SELECT * FROM token_tags WHERE token_id = $1', [token.id]);
    console.log('🏷️ Token tags for blox-myrc:', tokenTagsResult.rows);
    
    // Check what the service method would return
    const tagsQuery = `
      SELECT t.name 
      FROM tags t 
      JOIN token_tags tt ON t.id = tt.tag_id 
      WHERE tt.token_id = $1 
      ORDER BY t.name ASC
    `;
    const tagsQueryResult = await pool.query(tagsQuery, [token.id]);
    console.log('🔍 Tags query result (what service returns):', tagsQueryResult.rows.map(r => r.name));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkTokenTags();
