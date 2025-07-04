# OpenAI API Setup for AI Analysis

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Click "Create new secret key"
5. Copy the generated API key

## Configuration

### Option 1: Environment File (Recommended for Development)

1. Open `backend/.env.production` (or create `.env` for development)
2. Find the AI Integration section:
```env
# AI Integration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3
```

3. Replace `your-openai-api-key-here` with your actual API key:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Option 2: Environment Variables (Production)

Set these environment variables in your production environment:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3
```

## Configuration Options

- **OPENAI_MODEL**: Choose between `gpt-4`, `gpt-3.5-turbo`, or other available models
- **OPENAI_MAX_TOKENS**: Maximum tokens for AI responses (default: 2000)
- **OPENAI_TEMPERATURE**: Controls randomness (0.0 = deterministic, 1.0 = creative, default: 0.3)

## Testing the Setup

1. Start your backend server
2. Upload a contract file
3. Run a scan with vulnerabilities
4. Click "Deep Analysis" in the AI Analysis section
5. Check the console logs for:
   - ✅ "OpenAI client initialized" (success)
   - ⚠️ "OpenAI API key not found, using mock AI analysis" (needs setup)

## Cost Considerations

- GPT-4 is more expensive but provides better analysis
- GPT-3.5-turbo is cheaper but may have lower quality
- Monitor your usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

## Security Notes

- Never commit your API key to version control
- Use environment variables in production
- Consider using a proxy service for additional security
- Monitor API usage to prevent unexpected charges

## Troubleshooting

### API Key Not Working
1. Verify the key is correct and active
2. Check your OpenAI account has sufficient credits
3. Ensure the key has the correct permissions

### Rate Limiting
- OpenAI has rate limits based on your plan
- The system will fallback to mock data if rate limited
- Consider upgrading your OpenAI plan for higher limits

### Model Not Available
- Some models may not be available on all accounts
- Try switching to `gpt-3.5-turbo` if `gpt-4` is not available 