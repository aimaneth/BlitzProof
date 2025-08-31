import pool from '../config/postgres';

export interface TokenContract {
  id?: number;
  network: string;
  contractAddress: string;
}

export interface TokenExplorer {
  id?: number;
  explorerName: string;
  explorerUrl: string;
  network: string;
}

export interface TokenWallet {
  id?: number;
  walletName: string;
  walletUrl: string;
  walletType: string;
}

export interface TokenSocial {
  id?: number;
  platform: string; // twitter, telegram, discord, reddit, linkedin, website, whitepaper, github, gitlab, etherscan, certik, hacken, slowmist, quantstamp
  url: string;
}

export interface TokenAuditLink {
  id?: number;
  auditName: string;
  auditUrl: string;
  auditType: string;
}

export interface TokenSourceCode {
  id?: number;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  network?: string;
}

export interface SimpleToken {
  id: number;
  uniqueId: string;
  coinGeckoId: string;
  name: string;
  symbol: string;
  description?: string;
  network: string;
  contractAddress?: string;
  category: string;
  priority: number;
  riskLevel: string;
  monitoringStrategy: string;
  isActive: boolean;
  // New comprehensive fields
  website?: string;
  rank?: number;
  holderCount?: number;
  contractScore?: number;
  auditsCount?: number;
  // Related data
  socials?: TokenSocial[];
  contracts?: TokenContract[];
  explorers?: TokenExplorer[];
  wallets?: TokenWallet[];
  sourceCode?: TokenSourceCode[];
  auditLinks?: TokenAuditLink[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenWithPrice extends SimpleToken {
  price?: number;
  priceChange24h?: number;
  marketCap?: number;
  volume24h?: number;
  lastPriceUpdate?: Date;
}

export class SimpleTokenService {
  // Get contracts for a token
  private static async getTokenContracts(tokenId: number): Promise<TokenContract[]> {
    try {
      const query = 'SELECT * FROM token_contracts WHERE token_id = $1 ORDER BY created_at ASC';
      const result = await pool.query(query, [tokenId]);
             return result.rows.map(row => ({
         id: row.id,
         network: row.network,
         contractAddress: row.contract_address
       }));
    } catch (error) {
      console.error('Error getting token contracts:', error);
      return [];
    }
  }

  // Get explorers for a token
  private static async getTokenExplorers(tokenId: number): Promise<TokenExplorer[]> {
    try {
      const query = 'SELECT * FROM token_explorers WHERE token_id = $1 AND is_active = true ORDER BY created_at ASC';
      const result = await pool.query(query, [tokenId]);
             return result.rows.map(row => ({
         id: row.id,
         explorerName: row.explorer_name,
         explorerUrl: row.explorer_url,
         network: row.network
       }));
    } catch (error) {
      console.error('Error getting token explorers:', error);
      return [];
    }
  }

  // Get wallets for a token
  private static async getTokenWallets(tokenId: number): Promise<TokenWallet[]> {
    try {
      const query = 'SELECT * FROM token_wallets WHERE token_id = $1 AND is_active = true ORDER BY created_at ASC';
      const result = await pool.query(query, [tokenId]);
             return result.rows.map(row => ({
         id: row.id,
         walletName: row.wallet_name,
         walletUrl: row.wallet_url,
         walletType: row.wallet_type
       }));
    } catch (error) {
      console.error('Error getting token wallets:', error);
      return [];
    }
  }

  // Get socials for a token
  private static async getTokenSocials(tokenId: number): Promise<TokenSocial[]> {
    try {
      const query = 'SELECT * FROM token_socials WHERE token_id = $1 ORDER BY created_at ASC';
      const result = await pool.query(query, [tokenId]);
             return result.rows.map(row => ({
         id: row.id,
         platform: row.platform,
         url: row.url
       }));
    } catch (error) {
      console.error('Error getting token socials:', error);
      return [];
    }
  }

  // Get source code for a token
  private static async getTokenSourceCode(tokenId: number): Promise<TokenSourceCode[]> {
    try {
      const query = 'SELECT * FROM token_source_code WHERE token_id = $1 AND is_active = true ORDER BY created_at ASC';
      const result = await pool.query(query, [tokenId]);
             return result.rows.map(row => ({
         id: row.id,
         sourceType: row.source_type,
         sourceName: row.source_name,
         sourceUrl: row.source_url,
         network: row.network
       }));
    } catch (error) {
      console.error('Error getting token source code:', error);
      return [];
    }
  }

  // Get audit links for a token
  private static async getTokenAuditLinks(tokenId: number): Promise<TokenAuditLink[]> {
    try {
      const query = 'SELECT * FROM token_audit_links WHERE token_id = $1 ORDER BY created_at ASC';
      const result = await pool.query(query, [tokenId]);
             return result.rows.map(row => ({
         id: row.id,
         auditName: row.audit_name,
         auditUrl: row.audit_url,
         auditType: row.audit_type
       }));
    } catch (error) {
      console.error('Error getting token audit links:', error);
      return [];
    }
  }

  // Convert database row to SimpleToken interface
  private static async mapToToken(dbToken: any): Promise<SimpleToken> {
    const contracts = await this.getTokenContracts(dbToken.id);
    const explorers = await this.getTokenExplorers(dbToken.id);
    const wallets = await this.getTokenWallets(dbToken.id);
    const socials = await this.getTokenSocials(dbToken.id);
    const sourceCode = await this.getTokenSourceCode(dbToken.id);
    const auditLinks = await this.getTokenAuditLinks(dbToken.id);
    const tags = await this.getTokenTags(dbToken.id);
    
    return {
      id: dbToken.id,
      uniqueId: dbToken.unique_id,
      coinGeckoId: dbToken.coin_gecko_id,
      name: dbToken.name,
      symbol: dbToken.symbol,
      description: dbToken.description,
      network: dbToken.network,
      contractAddress: dbToken.contract_address,
      category: dbToken.category,
      priority: dbToken.priority,
      riskLevel: dbToken.risk_level,
      monitoringStrategy: dbToken.monitoring_strategy,
      isActive: dbToken.is_active,
      // New comprehensive fields
      website: dbToken.website,
      rank: dbToken.rank,
      holderCount: dbToken.holder_count,
      contractScore: dbToken.contract_score,
      auditsCount: dbToken.audits_count,
      // Related data
      socials: socials,
      contracts: contracts,
      explorers: explorers,
      wallets: wallets,
      sourceCode: sourceCode,
      auditLinks: auditLinks,
      tags: tags,
      createdAt: dbToken.created_at,
      updatedAt: dbToken.updated_at
    };
  }

  // Get all active tokens
  static async getAllTokens(): Promise<SimpleToken[]> {
    try {
      const query = `
        SELECT * FROM tokens 
        WHERE is_active = true 
        ORDER BY priority DESC, created_at DESC
      `;
      const result = await pool.query(query);
      const tokens = [];
      for (const row of result.rows) {
        tokens.push(await this.mapToToken(row));
      }
      return tokens;
    } catch (error) {
      console.error('Error getting all tokens:', error);
      throw error;
    }
  }

  // Get token by unique ID
  static async getTokenByUniqueId(uniqueId: string): Promise<SimpleToken | null> {
    try {
      const query = 'SELECT * FROM tokens WHERE unique_id = $1 AND is_active = true';
      const result = await pool.query(query, [uniqueId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return await this.mapToToken(result.rows[0]);
    } catch (error) {
      console.error('Error getting token by unique ID:', error);
      throw error;
    }
  }

  // Get token by CoinGecko ID
  static async getTokenByCoinGeckoId(coinGeckoId: string): Promise<SimpleToken | null> {
    try {
      const query = 'SELECT * FROM tokens WHERE coin_gecko_id = $1 AND is_active = true';
      const result = await pool.query(query, [coinGeckoId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return await this.mapToToken(result.rows[0]);
    } catch (error) {
      console.error('Error getting token by CoinGecko ID:', error);
      throw error;
    }
  }

  // Add new token
  static async addToken(token: Omit<SimpleToken, 'id' | 'createdAt' | 'updatedAt'>): Promise<SimpleToken> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert the main token
      const tokenQuery = `
        INSERT INTO tokens (
          unique_id, coin_gecko_id, name, symbol, description, network, 
          contract_address, category, priority, risk_level, monitoring_strategy,
          website, rank, holder_count, contract_score, audits_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;
      
      const tokenValues = [
        token.uniqueId,
        token.coinGeckoId,
        token.name,
        token.symbol,
        token.description,
        token.network || '',
        token.contractAddress || '',
        token.category,
        token.priority,
        token.riskLevel,
        token.monitoringStrategy,
        token.website,
        token.rank,
        token.holderCount,
        token.contractScore,
        token.auditsCount
      ];
      
      const tokenResult = await client.query(tokenQuery, tokenValues);
      const newToken = tokenResult.rows[0];
      
      // Insert social media links if provided
      if (token.socials && token.socials.length > 0) {
        for (const social of token.socials) {
          if (social.url.trim()) {
            const socialQuery = `
              INSERT INTO token_socials (token_id, platform, url, is_verified)
              VALUES ($1, $2, $3, $4)
            `;
                         await client.query(socialQuery, [
               newToken.id,
               social.platform,
               social.url,
               true // Default to verified
             ]);
          }
        }
      }
      
      // Insert contract addresses if provided
      if (token.contracts && token.contracts.length > 0) {
        for (const contract of token.contracts) {
          if (contract.contractAddress.trim()) {
            const contractQuery = `
              INSERT INTO token_contracts (token_id, network, contract_address, is_verified, is_active)
              VALUES ($1, $2, $3, $4, $5)
            `;
                         await client.query(contractQuery, [
               newToken.id,
               contract.network,
               contract.contractAddress,
               true, // Default to verified
               true  // Default to active
             ]);
          }
        }
      }

      // Insert explorer links if provided
      if (token.explorers && token.explorers.length > 0) {
        for (const explorer of token.explorers) {
          if (explorer.explorerUrl.trim()) {
            const explorerQuery = `
              INSERT INTO token_explorers (token_id, explorer_name, explorer_url, network, is_active)
              VALUES ($1, $2, $3, $4, $5)
            `;
                         await client.query(explorerQuery, [
               newToken.id,
               explorer.explorerName,
               explorer.explorerUrl,
               explorer.network,
               true // Default to active
             ]);
          }
        }
      }

      // Insert wallet links if provided
      if (token.wallets && token.wallets.length > 0) {
        for (const wallet of token.wallets) {
                     const walletQuery = `
             INSERT INTO token_wallets (token_id, wallet_name, wallet_url, wallet_type, is_active)
             VALUES ($1, $2, $3, $4, $5)
           `;
           await client.query(walletQuery, [
             newToken.id,
             wallet.walletName,
             wallet.walletUrl,
             wallet.walletType,
             true // Default to active
           ]);
        }
      }

      // Insert audit links if provided
      if (token.auditLinks && token.auditLinks.length > 0) {
        for (const audit of token.auditLinks) {
          if (audit.auditUrl.trim()) {
            const auditQuery = `
              INSERT INTO token_audit_links (token_id, audit_name, audit_url, audit_type, is_active)
              VALUES ($1, $2, $3, $4, $5)
            `;
                         await client.query(auditQuery, [
               newToken.id,
               audit.auditName,
               audit.auditUrl,
               audit.auditType,
               true // Default to active
             ]);
          }
        }
      }

      // Insert source code links if provided
      if (token.sourceCode && token.sourceCode.length > 0) {
        for (const source of token.sourceCode) {
          if (source.sourceUrl.trim()) {
            const sourceQuery = `
              INSERT INTO token_source_code (token_id, source_type, source_name, source_url, network, is_verified, is_active)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
                         await client.query(sourceQuery, [
               newToken.id,
               source.sourceType,
               source.sourceName,
               source.sourceUrl,
               source.network,
               true, // Default to verified
               true  // Default to active
             ]);
          }
        }
      }

      // Insert tags if provided
      if (token.tags && token.tags.length > 0) {
        await this.setTokenTags(newToken.id, token.tags);
      }
      
      await client.query('COMMIT');
      return await this.mapToToken(newToken);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding token:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update token
  static async updateToken(uniqueId: string, updates: Partial<SimpleToken>): Promise<SimpleToken> {
    const client = await pool.connect();
    try {
      console.log(`🔍 Updating token ${uniqueId} with updates:`, updates);
      
      await client.query('BEGIN');
      
      // Check if token exists
      const existingToken = await this.getTokenByUniqueId(uniqueId);
      if (!existingToken) {
        throw new Error(`Token with unique ID '${uniqueId}' not found`);
      }

      const setFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Build dynamic update query
      if (updates.uniqueId !== undefined) {
        setFields.push(`unique_id = $${paramCount++}`);
        values.push(updates.uniqueId);
      }
      if (updates.coinGeckoId !== undefined) {
        setFields.push(`coin_gecko_id = $${paramCount++}`);
        values.push(updates.coinGeckoId);
      }
      if (updates.name !== undefined) {
        setFields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.symbol !== undefined) {
        setFields.push(`symbol = $${paramCount++}`);
        values.push(updates.symbol);
      }
      if (updates.description !== undefined) {
        setFields.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }
      if (updates.network !== undefined) {
        setFields.push(`network = $${paramCount++}`);
        values.push(updates.network);
      }
      if (updates.contractAddress !== undefined) {
        setFields.push(`contract_address = $${paramCount++}`);
        values.push(updates.contractAddress);
      }
      if (updates.category !== undefined) {
        setFields.push(`category = $${paramCount++}`);
        values.push(updates.category);
      }
      if (updates.priority !== undefined) {
        setFields.push(`priority = $${paramCount++}`);
        values.push(updates.priority);
      }
      if (updates.riskLevel !== undefined) {
        setFields.push(`risk_level = $${paramCount++}`);
        values.push(updates.riskLevel);
      }
      if (updates.monitoringStrategy !== undefined) {
        setFields.push(`monitoring_strategy = $${paramCount++}`);
        values.push(updates.monitoringStrategy);
      }
      if (updates.website !== undefined) {
        setFields.push(`website = $${paramCount++}`);
        values.push(updates.website);
      }
      if (updates.rank !== undefined) {
        setFields.push(`rank = $${paramCount++}`);
        values.push(updates.rank);
      }
      if (updates.holderCount !== undefined) {
        setFields.push(`holder_count = $${paramCount++}`);
        values.push(updates.holderCount);
      }
      if (updates.contractScore !== undefined) {
        setFields.push(`contract_score = $${paramCount++}`);
        values.push(updates.contractScore);
      }
      if (updates.auditsCount !== undefined) {
        setFields.push(`audits_count = $${paramCount++}`);
        values.push(updates.auditsCount);
      }

      // Update main token if there are changes
      if (setFields.length > 0) {
        values.push(uniqueId);
        const query = `
          UPDATE tokens 
          SET ${setFields.join(', ')}
          WHERE unique_id = $${paramCount}
          RETURNING *
        `;
        
        console.log(`🔍 SQL query: ${query}`);
        console.log(`🔍 Values:`, values);
        
        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
          throw new Error(`Token with unique ID '${uniqueId}' not found`);
        }
      }

      // Update contracts if provided
      if (updates.contracts !== undefined) {
        // Delete existing contracts
        await client.query('DELETE FROM token_contracts WHERE token_id = $1', [existingToken.id]);
        
        // Insert new contracts
        for (const contract of updates.contracts) {
          if (contract.contractAddress.trim()) {
            const contractQuery = `
              INSERT INTO token_contracts (token_id, network, contract_address, is_verified, is_active)
              VALUES ($1, $2, $3, $4, $5)
            `;
                         await client.query(contractQuery, [
               existingToken.id,
               contract.network,
               contract.contractAddress,
               true, // Default to verified
               true  // Default to active
             ]);
          }
        }
      }

      // Update explorers if provided
      if (updates.explorers !== undefined) {
        // Delete existing explorers
        await client.query('DELETE FROM token_explorers WHERE token_id = $1', [existingToken.id]);
        
        // Insert new explorers
        for (const explorer of updates.explorers) {
          if (explorer.explorerUrl.trim()) {
            const explorerQuery = `
              INSERT INTO token_explorers (token_id, explorer_name, explorer_url, network, is_active)
              VALUES ($1, $2, $3, $4, $5)
            `;
                         await client.query(explorerQuery, [
               existingToken.id,
               explorer.explorerName,
               explorer.explorerUrl,
               explorer.network,
               true // Default to active
             ]);
          }
        }
      }

      // Update wallets if provided
      if (updates.wallets !== undefined) {
        // Delete existing wallets
        await client.query('DELETE FROM token_wallets WHERE token_id = $1', [existingToken.id]);
        
        // Insert new wallets
        for (const wallet of updates.wallets) {
                     const walletQuery = `
             INSERT INTO token_wallets (token_id, wallet_name, wallet_url, wallet_type, is_active)
             VALUES ($1, $2, $3, $4, $5)
           `;
           await client.query(walletQuery, [
             existingToken.id,
             wallet.walletName,
             wallet.walletUrl,
             wallet.walletType,
             true // Default to active
           ]);
        }
      }

      // Update source code if provided
      if (updates.sourceCode !== undefined) {
        // Delete existing source code
        await client.query('DELETE FROM token_source_code WHERE token_id = $1', [existingToken.id]);
        
        // Insert new source code
        for (const source of updates.sourceCode) {
          if (source.sourceUrl.trim()) {
            const sourceQuery = `
              INSERT INTO token_source_code (token_id, source_type, source_name, source_url, network, is_verified, is_active)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
                         await client.query(sourceQuery, [
               existingToken.id,
               source.sourceType,
               source.sourceName,
               source.sourceUrl,
               source.network,
               true, // Default to verified
               true  // Default to active
             ]);
          }
        }
      }

      // Update socials if provided
      if (updates.socials !== undefined) {
        // Delete existing socials
        await client.query('DELETE FROM token_socials WHERE token_id = $1', [existingToken.id]);
        
        // Insert new socials
        for (const social of updates.socials) {
          if (social.url.trim()) {
            const socialQuery = `
              INSERT INTO token_socials (token_id, platform, url, is_verified)
              VALUES ($1, $2, $3, $4)
            `;
                         await client.query(socialQuery, [
               existingToken.id,
               social.platform,
               social.url,
               true // Default to verified
             ]);
          }
        }
      }

      // Update audit links if provided
      if (updates.auditLinks !== undefined) {
        // Delete existing audit links
        await client.query('DELETE FROM token_audit_links WHERE token_id = $1', [existingToken.id]);
        
        // Insert new audit links
        for (const audit of updates.auditLinks) {
          if (audit.auditUrl.trim()) {
            const auditQuery = `
              INSERT INTO token_audit_links (token_id, audit_name, audit_url, audit_type, is_active)
              VALUES ($1, $2, $3, $4, $5)
            `;
                         await client.query(auditQuery, [
               existingToken.id,
               audit.auditName,
               audit.auditUrl,
               audit.auditType,
               true // Default to active
             ]);
          }
        }
      }

      // Update tags if provided
      if (updates.tags !== undefined) {
        await this.setTokenTags(existingToken.id, updates.tags);
      }
      
      await client.query('COMMIT');
      
      // Get updated token with contracts
      const updatedToken = await this.getTokenByUniqueId(uniqueId);
      console.log(`✅ Token updated successfully:`, updatedToken);
      
      return updatedToken!;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating token:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete token (soft delete)
  static async deleteToken(uniqueId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE tokens 
        SET is_active = false 
        WHERE unique_id = $1 
        RETURNING *
      `;
      
      const result = await pool.query(query, [uniqueId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Token with unique ID '${uniqueId}' not found`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting token:', error);
      throw error;
    }
  }

  // Get token with price data from APIs
  static async getTokenWithPrice(uniqueId: string): Promise<TokenWithPrice | null> {
    try {
      const token = await this.getTokenByUniqueId(uniqueId);
      if (!token) {
        return null;
      }

      // Import PriceDataService dynamically to avoid circular dependencies
      const { PriceDataService } = await import('./priceDataService');
      const priceService = new PriceDataService();

      // Get cached price data first (fast)
      const cachedPrice = await priceService.getCachedPrice(token.coinGeckoId);
      
      if (cachedPrice && cachedPrice.price > 0) {
        // Return token with cached price data
        return {
          ...token,
          price: cachedPrice.price,
          priceChange24h: cachedPrice.priceChange24h,
          marketCap: cachedPrice.marketCap,
          volume24h: cachedPrice.volume24h,
          lastPriceUpdate: cachedPrice.lastUpdated
        };
      }

      // If no cached data, fetch fresh data (slower but more accurate)
      console.log(`🔄 No cached price data for ${uniqueId}, fetching fresh data...`);
      const freshPrice = await priceService.refreshTokenPrice(token.coinGeckoId);
      
      return {
        ...token,
        price: freshPrice.price,
        priceChange24h: freshPrice.priceChange24h,
        marketCap: freshPrice.marketCap,
        volume24h: freshPrice.volume24h,
        lastPriceUpdate: freshPrice.lastUpdated
      };

    } catch (error) {
      console.error('Error getting token with price:', error);
      
      // Return token without price data on error
      const token = await this.getTokenByUniqueId(uniqueId);
      if (!token) {
        return null;
      }
      
      return {
        ...token,
        price: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        lastPriceUpdate: new Date()
      };
    }
  }

  // Get tags for a token
  private static async getTokenTags(tokenId: number): Promise<string[]> {
    try {
      const query = `
        SELECT t.name 
        FROM tags t 
        JOIN token_tags tt ON t.id = tt.tag_id 
        WHERE tt.token_id = $1 
        ORDER BY t.name ASC
      `;
      const result = await pool.query(query, [tokenId]);
      return result.rows.map(row => row.name);
    } catch (error) {
      console.error('Error getting token tags:', error);
      return [];
    }
  }

  // Set tags for a token
  private static async setTokenTags(tokenId: number, tags: string[]): Promise<void> {
    try {
      // First, delete existing tags
      await pool.query('DELETE FROM token_tags WHERE token_id = $1', [tokenId]);
      
      if (tags.length === 0) return;
      
      // Insert new tags
      for (const tagName of tags) {
        if (tagName.trim()) {
          // First, ensure the tag exists in the tags table
          const tagQuery = `
            INSERT INTO tags (name, category, description) 
            VALUES ($1, 'category', $2) 
            ON CONFLICT (name) DO NOTHING
            RETURNING id
          `;
          const tagResult = await pool.query(tagQuery, [tagName, `Tag for ${tagName}`]);
          
          // Get the tag ID (either newly created or existing)
          const getTagQuery = 'SELECT id FROM tags WHERE name = $1';
          const getTagResult = await pool.query(getTagQuery, [tagName]);
          
          if (getTagResult.rows.length > 0) {
            const tagId = getTagResult.rows[0].id;
            
            // Insert the token-tag relationship
            await pool.query(
              'INSERT INTO token_tags (token_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [tokenId, tagId]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error setting token tags:', error);
      throw error;
    }
  }
}
