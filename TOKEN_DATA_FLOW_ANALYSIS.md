# 🔍 COMPLETE TOKEN DATA FLOW ANALYSIS

## 📊 **CURRENT DATA SOURCES**

### 1. **MAIN BLOCKNET PAGE (Trending Token Table)**
- **Data Source**: `/api/cached/dashboard` 
- **Backend**: `CachedTokenController.getCachedDashboard()`
- **Database**: `cached_token_data` table + `manual_tokens` table
- **Logic**: 
  - Gets all cached tokens from `cached_token_data`
  - Gets all manual tokens from `manual_tokens` 
  - **MERGES** them using `coin_gecko_id` as the key
  - Returns cached data for tokens that exist, placeholders for those that don't

### 2. **TOKEN DETAILS PAGE (`/blocknet/[tokenId]`)**
- **Data Source**: `apiService.getManualTokens()` + `apiService.getTrendingTokens()`
- **Backend**: `blockNetController.listManualTokens()` + `blockNetDataService.getTrendingTokens()`
- **Database**: `manual_tokens` table + external APIs (CoinGecko, DexScreener)
- **Logic**:
  - Finds token by `tokenId` in `manual_tokens` table
  - Gets price data from trending tokens using `coinGeckoId`
  - **PRIORITIZES** manual token data for name/symbol/description

### 3. **ADMIN PAGE (Token Management)**
- **Data Source**: `apiService.getManualTokens()`
- **Backend**: `blockNetController.listManualTokens()`
- **Database**: `manual_tokens` table only
- **Logic**: Direct access to manual tokens for management

## ⚠️ **CRITICAL ISSUES IDENTIFIED**

### **ISSUE 1: INCONSISTENT DATA SOURCES**
```
Main Page: cached_token_data + manual_tokens (MERGED)
Token Details: manual_tokens + trending_tokens (MERGED)  
Admin Page: manual_tokens only
```

### **ISSUE 2: DIFFERENT MERGE LOGICS**
```
Main Page: Uses coin_gecko_id to merge cached + manual data
Token Details: Uses tokenId to find manual, coinGeckoId to find trending
```

### **ISSUE 3: UPDATE FLOW INCONSISTENCY**
```
Admin Edit → manual_tokens table → ✅ Updated
Token Details Refresh → manual_tokens table → ✅ Updated  
Main Page Refresh → cached_token_data table → ❌ NOT UPDATED
```

## 🔧 **ROOT CAUSE ANALYSIS**

### **Why Token Details Don't Reflect Updates:**

1. **Token Details Page**: Uses `manual_tokens` table ✅ (CORRECT)
2. **Main Page**: Uses `cached_token_data` table ❌ (WRONG)
3. **When you edit a token**: Only `manual_tokens` is updated
4. **Main page still shows**: Old data from `cached_token_data`

### **The Cached Dashboard Problem:**
```sql
-- This query in CachedTokenController.getCachedDashboard()
SELECT * FROM cached_token_data ctd
INNER JOIN manual_tokens mt ON ctd.coin_gecko_id = mt.coin_gecko_id
WHERE mt.is_active = true
```

**Problem**: The cached dashboard is using `cached_token_data` as the primary source, and only merging with `manual_tokens` for active status. When you update a token in admin, it only updates `manual_tokens`, but the main page is still showing data from `cached_token_data`.

## 🎯 **SOLUTION: UNIFIED DATA SOURCE**

### **Option 1: Make Main Page Use Manual Tokens (RECOMMENDED)**
- Change main page to use `manual_tokens` as primary source
- Use `cached_token_data` only for price/market data
- Ensure all token details (name, symbol, description) come from `manual_tokens`

### **Option 2: Update Cached Data When Manual Tokens Change**
- Add triggers or background jobs to update `cached_token_data` when `manual_tokens` changes
- Keep current architecture but ensure data consistency

### **Option 3: Single Source of Truth**
- Remove `cached_token_data` table entirely
- Use only `manual_tokens` for all token information
- Use external APIs only for real-time price data

## 🚀 **IMMEDIATE FIX NEEDED**

The main page (`/blocknet`) needs to be updated to use `manual_tokens` as the primary source for token details (name, symbol, description) and only use `cached_token_data` for price/market information.

This will ensure that when you edit a token in admin, ALL pages will immediately reflect the changes.
