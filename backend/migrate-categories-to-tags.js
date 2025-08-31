const pool = require('./dist/config/postgres.js').default;

async function migrateCategoresToTags() {
  try {
    console.log('🔄 Migrating existing categories to tags system...');
    
    // Get all tokens with categories
    const tokensResult = await pool.query('SELECT id, unique_id, name, category FROM tokens WHERE category IS NOT NULL AND category != \'\'');
    console.log(`📋 Found ${tokensResult.rows.length} tokens with categories`);
    
    for (const token of tokensResult.rows) {
      console.log(`\n🔍 Processing token: ${token.name} (${token.unique_id})`);
      console.log(`   Current category: ${token.category}`);
      
      // Check if this category exists in tags table
      let tagResult = await pool.query('SELECT id FROM tags WHERE name = $1', [token.category]);
      
      let tagId;
      if (tagResult.rows.length === 0) {
        // Create the tag if it doesn't exist
        console.log(`   ➕ Creating new tag: ${token.category}`);
        const createTagResult = await pool.query(
          'INSERT INTO tags (name, category, description) VALUES ($1, $2, $3) RETURNING id',
          [token.category, 'category', `Category for ${token.category}`]
        );
        tagId = createTagResult.rows[0].id;
      } else {
        tagId = tagResult.rows[0].id;
        console.log(`   ✅ Tag already exists with ID: ${tagId}`);
      }
      
      // Check if token_tags relationship already exists
      const existingRelation = await pool.query(
        'SELECT * FROM token_tags WHERE token_id = $1 AND tag_id = $2', 
        [token.id, tagId]
      );
      
      if (existingRelation.rows.length === 0) {
        // Create the token_tags relationship
        await pool.query(
          'INSERT INTO token_tags (token_id, tag_id) VALUES ($1, $2)',
          [token.id, tagId]
        );
        console.log(`   ✅ Created token_tags relationship`);
      } else {
        console.log(`   ⚠️ Token_tags relationship already exists`);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    
    // Verify the results
    console.log('\n🔍 Verification - checking blox-myrc tags:');
    const verifyResult = await pool.query(`
      SELECT t.name 
      FROM tags t 
      JOIN token_tags tt ON t.id = tt.tag_id 
      WHERE tt.token_id = (SELECT id FROM tokens WHERE unique_id = 'blox-myrc')
    `);
    console.log('✅ blox-myrc now has tags:', verifyResult.rows.map(r => r.name));
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrateCategoresToTags();
