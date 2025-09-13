import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectToMongoDB(): Promise<Db> {
  if (db) {
    return db
  }

  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set')
    }

    console.log('🔍 MongoDB URI from environment:', mongoUri ? 'Set' : 'Not set')
    if (mongoUri) {
      console.log('🔍 MongoDB URI (masked):', mongoUri.replace(/\/\/.*@/, '//***:***@'))
    }

    client = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    await client.connect()
    console.log('✅ Connected to MongoDB')

    // Use the database name from the URI or default to 'blitzproof'
    const dbName = mongoUri.split('/').pop()?.split('?')[0] || 'blitzproof'
    db = client.db(dbName)

    // Create indexes for better performance
    await createIndexes(db)

    return db
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
}

async function createIndexes(db: Db) {
  try {
    // Create indexes for tokens collection
    await db.collection('tokens').createIndex({ coin_gecko_id: 1 }, { unique: true, sparse: true })
    await db.collection('tokens').createIndex({ unique_id: 1 }, { unique: true })
    await db.collection('tokens').createIndex({ contract_address: 1 })
    await db.collection('tokens').createIndex({ last_price_update: 1 })

    // Create indexes for price_data collection (if we use separate collection)
    await db.collection('price_data').createIndex({ token_id: 1 }, { unique: true })
    await db.collection('price_data').createIndex({ last_updated: 1 })

    console.log('✅ MongoDB indexes created')
  } catch (error) {
    console.warn('⚠️ Error creating MongoDB indexes:', error)
  }
}

export async function getMongoDB(): Promise<Db> {
  if (!db) {
    return await connectToMongoDB()
  }
  return db
}

export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log('✅ MongoDB connection closed')
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeMongoDB()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closeMongoDB()
  process.exit(0)
})
