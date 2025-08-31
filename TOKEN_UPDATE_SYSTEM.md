# 🔄 Token Update System Documentation

## Overview

The token update system ensures that when token information is modified through the admin interface, all related data sources, caches, and services are properly synchronized. This prevents data inconsistency issues where the main dashboard shows outdated information.

## 🏗️ Architecture

### Data Flow

```
Admin Edit Token → Manual Token Service → Database Update → Price Cache Invalidation → WebSocket Broadcast → Background Refresh
```

### Data Separation Strategy

**🆕 CLEAR SEPARATION OF CONCERNS:**

1. **Static Data (Manual Tokens Table)**
   - Name, Symbol, Description
   - Contract Address, Network
   - Category, Priority, Risk Level
   - Monitoring Strategy, Alert Thresholds

2. **Real-time Data (Cache)**
   - Price, Price Change 24h
   - Market Cap, Volume 24h
   - Security Score, Holder Count
   - DEX Pairs, Price History
   - API Data (CoinGecko, DexScreener)

### Components

1. **Manual Token Service** (`backend/src/services/manualTokenService.ts`)
   - Handles CRUD operations for manual tokens
   - Manages static token information
   - Triggers price cache invalidation

2. **Cached Token Data Service** (`backend/src/services/cachedTokenDataService.ts`)
   - Manages ONLY price/real-time data
   - Combines with manual token data for complete view
   - Provides unified data access

3. **Database Schema** (`backend/src/database/migrations/`)
   - `manual_tokens`: Static token information
   - `cached_token_data`: Price/real-time data only
   - No triggers needed - clean separation

4. **Background Refresh Service** (`backend/src/services/backgroundRefreshService.ts`)
   - Refreshes real-time data from external APIs
   - Only updates price/real-time data
   - Static data comes from manual tokens

5. **WebSocket Service** (`backend/src/services/websocketService.ts`)
   - Broadcasts token updates to connected clients
   - Enables real-time UI updates

## 🔧 Implementation Details

### 1. Manual Token Update Process

When a token is updated via the admin interface:

```typescript
// 1. Controller receives update request
export const updateManualToken = async (req: Request, res: Response) => {
  const updatedToken = await updateManualTokenConfig(tokenId, updates);
  
  // 2. Broadcast to WebSocket clients
  wsService.broadcastToAll(updateMessage);
  
  return updatedToken;
};
```

### 2. Price Cache Invalidation

The `ManualTokenService.updateToken()` method performs:

```typescript
private static async invalidateRelatedCaches(updatedToken: ManualToken) {
  // 🆕 ONLY CLEAR PRICE CACHES
  await this.clearRedisCaches(updatedToken);
  
  // 🆕 TRIGGER BACKGROUND REFRESH FOR PRICE DATA
  await this.triggerBackgroundRefresh(updatedToken);
  
  // 🆕 BROADCAST WEBSOCKET UPDATE
  await this.broadcastTokenUpdate(updatedToken);
}
```

### 3. Data Combination Strategy

The system combines static and real-time data:

```typescript
// In CachedTokenDataService.getAllCachedTokens()
const query = `
  SELECT 
    -- 🆕 CACHED PRICE/REAL-TIME DATA
    ctd.token_id, ctd.coin_gecko_id, ctd.price, ctd.price_change_24h,
    ctd.market_cap, ctd.volume_24h, ctd.security_score, ctd.holder_count,
    ctd.dex_pairs, ctd.price_history, ctd.api_data, ctd.last_api_update,
    -- 🆕 STATIC DATA FROM MANUAL TOKENS (PRIMARY SOURCE)
    mt.name, mt.symbol, mt.network, mt.address, mt.contract_type,
    mt.category, mt.priority, mt.risk_level, mt.monitoring_strategy, mt.description
  FROM manual_tokens mt
  LEFT JOIN cached_token_data ctd ON mt.coin_gecko_id = ctd.coin_gecko_id
  WHERE mt.is_active = true
`;
```

## 📊 Data Consistency Guarantees

### 1. Immediate Updates
- ✅ Manual tokens table updated immediately
- ✅ Static data changes reflected instantly
- ✅ WebSocket broadcasts sent to clients

### 2. Price Data Synchronization
- ✅ Background refresh jobs triggered
- ✅ Redis price caches cleared
- ✅ API data refreshed with new token details

### 3. Fallback Mechanisms
- ✅ Manual token data is authoritative for static info
- ✅ Price data can be refreshed independently
- ✅ Graceful error handling prevents update failures

## 🧪 Testing

### Manual Testing
1. Add a test token via admin interface
2. Edit token details (name, symbol, network, etc.)
3. Verify changes appear immediately on main dashboard
4. Check that price data is refreshed
5. Verify WebSocket updates are received

### Automated Testing
Run the comprehensive test script:

```bash
cd backend
node test-token-update-system.js
```

This test verifies:
- ✅ Token addition
- ✅ Token updates
- ✅ Static data consistency
- ✅ Price cache invalidation
- ✅ WebSocket broadcasting
- ✅ Background refresh triggering

## 🔍 Troubleshooting

### Common Issues

1. **Token updates not reflected on main page**
   - Check if manual_tokens table is updated
   - Verify the query joins manual_tokens and cached_token_data
   - Check WebSocket connection status

2. **Price cache not clearing**
   - Verify Redis connection
   - Check price cache key patterns
   - Review cache invalidation logs

3. **Background refresh not working**
   - Check background service status
   - Verify job queue is processing
   - Review error logs

### Debug Commands

```bash
# Check manual tokens
curl http://localhost:4000/api/blocknet/manual-tokens

# Check cached price data
curl http://localhost:4000/api/cached/token/{tokenId}

# Check combined data
curl http://localhost:4000/api/blocknet/dashboard

# Check WebSocket status
curl http://localhost:4000/ws
```

## 🚀 Performance Considerations

### Optimizations
- Clean separation reduces cache complexity
- Manual tokens table is the single source of truth for static data
- Price cache only contains frequently changing data
- WebSocket broadcasts are non-blocking

### Monitoring
- Monitor manual token table performance
- Track price cache hit/miss ratios
- Monitor background job queue length
- Track WebSocket connection counts

## 📝 API Endpoints

### Token Management
- `POST /api/blocknet/manual-tokens` - Add token
- `PUT /api/blocknet/manual-tokens/:tokenId` - Update token
- `DELETE /api/blocknet/manual-tokens/:tokenId` - Remove token
- `GET /api/blocknet/manual-tokens` - List tokens

### Price Cache Management
- `GET /api/cached/token/:tokenId` - Get cached price data
- `POST /api/cached/refresh/:tokenId` - Force refresh price data
- `GET /api/cached/refresh/status` - Get refresh status

### Dashboard
- `GET /api/blocknet/dashboard` - Get combined data
- `GET /api/blocknet/trending` - Get trending tokens

## 🔮 Future Enhancements

1. **Advanced Price Caching**
   - Implement price history caching
   - Add chart data caching
   - Implement DEX pair caching

2. **Real-time Price Updates**
   - WebSocket price feeds
   - Real-time chart updates
   - Live market data

3. **Enhanced Monitoring**
   - Price data quality metrics
   - Cache performance monitoring
   - API rate limit tracking

4. **Performance Optimization**
   - Implement price data compression
   - Add connection pooling
   - Optimize database queries

## 📚 Related Files

- `backend/src/services/manualTokenService.ts` - Static token management
- `backend/src/services/cachedTokenDataService.ts` - Price data management
- `backend/src/controllers/blockNetController.ts` - API endpoints
- `backend/src/database/migrations/003_create_manual_tokens_table.sql` - Static data schema
- `backend/src/database/migrations/004_update_cached_token_data_structure.sql` - Price data schema
- `backend/test-token-update-system.js` - Test script
- `frontend/src/components/ui/edit-token-modal.tsx` - Frontend edit interface
