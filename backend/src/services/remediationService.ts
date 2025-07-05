import { Vulnerability } from '../types/scan'

export interface RemediationStep {
  id: string
  title: string
  description: string
  code: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: string
  riskLevel: 'low' | 'medium' | 'high'
  references: string[]
}

export interface RemediationPlan {
  vulnerabilityId: string
  vulnerabilityTitle: string
  severity: string
  currentCode: string
  steps: RemediationStep[]
  totalEstimatedTime: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  automated: boolean
  aiGenerated: boolean
  confidence: number
}

export interface SecurityBestPractice {
  id: string
  category: string
  title: string
  description: string
  codeExample: string
  references: string[]
  tags: string[]
}

export class RemediationService {
  private readonly vulnerabilityPatterns: Record<string, any> = {
    'reentrancy': {
      patterns: [
        /call\.value\(/,
        /\.transfer\(/,
        /\.send\(/,
        /external.*payable/,
        /modifier.*nonReentrant/
      ],
      fixes: [
        {
          title: 'Use ReentrancyGuard',
          description: 'Implement OpenZeppelin ReentrancyGuard to prevent reentrancy attacks',
          code: `import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecureContract is ReentrancyGuard {
    function withdraw() external nonReentrant {
        // Withdrawal logic here
    }
}`,
          explanation: 'The nonReentrant modifier prevents the function from being called recursively',
          difficulty: 'medium',
          estimatedTime: '30 minutes',
          riskLevel: 'low',
          references: [
            'https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard',
            'https://consensys.net/diligence/2019/09/stop-using-soliditys-transfer-now/'
          ]
        },
        {
          title: 'Checks-Effects-Interactions Pattern',
          description: 'Follow the checks-effects-interactions pattern to prevent reentrancy',
          code: `function withdraw() external {
    uint256 amount = balances[msg.sender];
    require(amount > 0, "Insufficient balance");
    
    // 1. Checks
    balances[msg.sender] = 0;
    
    // 2. Effects
    emit Withdrawal(msg.sender, amount);
    
    // 3. Interactions (last)
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}`,
          explanation: 'Update state variables before making external calls',
          difficulty: 'easy',
          estimatedTime: '15 minutes',
          riskLevel: 'low',
          references: [
            'https://fravoll.github.io/solidity-patterns/checks_effects_interactions.html'
          ]
        }
      ]
    },
    'overflow': {
      patterns: [
        /uint.*\+/,
        /uint.*\*/,
        /SafeMath/,
        /overflow/
      ],
      fixes: [
        {
          title: 'Use SafeMath Library',
          description: 'Implement SafeMath for arithmetic operations to prevent overflows',
          code: `import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SecureContract {
    using SafeMath for uint256;
    
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a.add(b);
    }
}`,
          explanation: 'SafeMath provides overflow protection for arithmetic operations',
          difficulty: 'easy',
          estimatedTime: '10 minutes',
          riskLevel: 'low',
          references: [
            'https://docs.openzeppelin.com/contracts/4.x/api/utils#SafeMath'
          ]
        },
        {
          title: 'Use Solidity 0.8+ Built-in Overflow Protection',
          description: 'Upgrade to Solidity 0.8+ which has built-in overflow protection',
          code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecureContract {
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b; // Built-in overflow protection in 0.8+
    }
}`,
          explanation: 'Solidity 0.8+ automatically reverts on overflow/underflow',
          difficulty: 'medium',
          estimatedTime: '1 hour',
          riskLevel: 'low',
          references: [
            'https://docs.soliditylang.org/en/v0.8.0/080-breaking-changes.html'
          ]
        }
      ]
    },
    'access-control': {
      patterns: [
        /onlyOwner/,
        /modifier.*only/,
        /access.*control/,
        /role.*based/
      ],
      fixes: [
        {
          title: 'Implement Role-Based Access Control',
          description: 'Use OpenZeppelin AccessControl for secure role management',
          code: `import "@openzeppelin/contracts/access/AccessControl.sol";

contract SecureContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    function sensitiveFunction() external onlyRole(ADMIN_ROLE) {
        // Admin-only logic
    }
}`,
          explanation: 'AccessControl provides flexible role-based permissions',
          difficulty: 'medium',
          estimatedTime: '45 minutes',
          riskLevel: 'low',
          references: [
            'https://docs.openzeppelin.com/contracts/4.x/api/access#AccessControl'
          ]
        },
        {
          title: 'Use Ownable Pattern',
          description: 'Implement simple ownership pattern for basic access control',
          code: `import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureContract is Ownable {
    function sensitiveFunction() external onlyOwner {
        // Owner-only logic
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        _transferOwnership(newOwner);
    }
}`,
          explanation: 'Ownable provides simple ownership-based access control',
          difficulty: 'easy',
          estimatedTime: '20 minutes',
          riskLevel: 'low',
          references: [
            'https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable'
          ]
        }
      ]
    },
    'unchecked-return': {
      patterns: [
        /\.call\(/,
        /\.send\(/,
        /\.transfer\(/,
        /require\(.*success/
      ],
      fixes: [
        {
          title: 'Check Return Values',
          description: 'Always check return values from external calls',
          code: `function withdraw() external {
    uint256 amount = balances[msg.sender];
    require(amount > 0, "Insufficient balance");
    
    balances[msg.sender] = 0;
    
    // Check return value
    (bool success, bytes memory data) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
    
    // Optional: Check data if needed
    if (data.length > 0) {
        // Handle return data
    }
}`,
          explanation: 'Always verify that external calls succeeded',
          difficulty: 'easy',
          estimatedTime: '15 minutes',
          riskLevel: 'low',
          references: [
            'https://consensys.net/diligence/2019/09/stop-using-soliditys-transfer-now/'
          ]
        }
      ]
    },
    'timestamp-dependence': {
      patterns: [
        /block\.timestamp/,
        /now/,
        /time.*based/
      ],
      fixes: [
        {
          title: 'Use Block Numbers Instead of Timestamps',
          description: 'Use block numbers for time-based logic when possible',
          code: `contract SecureContract {
    uint256 public constant BLOCKS_PER_DAY = 5760; // ~15 seconds per block
    
    function timeBasedFunction() external view {
        // Use block numbers instead of timestamps
        uint256 currentBlock = block.number;
        uint256 targetBlock = currentBlock + BLOCKS_PER_DAY;
        
        // Time-based logic using blocks
    }
}`,
          explanation: 'Block numbers are more reliable than timestamps for time-based logic',
          difficulty: 'medium',
          estimatedTime: '30 minutes',
          riskLevel: 'low',
          references: [
            'https://consensys.net/diligence/2019/09/stop-using-soliditys-transfer-now/'
          ]
        },
        {
          title: 'Add Time Buffer',
          description: 'Add buffer time to timestamp-based logic',
          code: `contract SecureContract {
    uint256 public constant TIME_BUFFER = 300; // 5 minutes
    
    function timeBasedFunction() external view {
        uint256 currentTime = block.timestamp;
        uint256 targetTime = currentTime + TIME_BUFFER;
        
        // Add buffer to prevent timestamp manipulation
    }
}`,
          explanation: 'Adding buffer time prevents timestamp manipulation attacks',
          difficulty: 'easy',
          estimatedTime: '10 minutes',
          riskLevel: 'low',
          references: [
            'https://consensys.net/diligence/2019/09/stop-using-soliditys-transfer-now/'
          ]
        }
      ]
    }
  }

  private readonly bestPractices: SecurityBestPractice[] = [
    {
      id: 'secure-randomness',
      category: 'Randomness',
      title: 'Use VRF for Secure Randomness',
      description: 'Use Chainlink VRF for secure on-chain randomness',
      codeExample: `import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract SecureRandom is VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;
    
    constructor(address _vrfCoordinator, address _link) 
        VRFConsumerBase(_vrfCoordinator, _link) {
        keyHash = 0x...;
        fee = 0.1 * 10**18;
    }
    
    function requestRandomness() external returns (bytes32 requestId) {
        return requestRandomness(keyHash, fee);
    }
}`,
      references: [
        'https://docs.chain.link/docs/chainlink-vrf/',
        'https://consensys.net/diligence/2019/09/stop-using-soliditys-transfer-now/'
      ],
      tags: ['randomness', 'security', 'chainlink']
    },
    {
      id: 'secure-upgrades',
      category: 'Upgrades',
      title: 'Use Proxy Pattern for Upgrades',
      description: 'Implement upgradeable contracts using proxy pattern',
      codeExample: `import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract Implementation is UUPSUpgradeable {
    function _authorizeUpgrade(address newImplementation) internal override {
        // Authorization logic
    }
}

contract Proxy is ERC1967Proxy {
    constructor(address _implementation, bytes memory _data) 
        ERC1967Proxy(_implementation, _data) {}
}`,
      references: [
        'https://docs.openzeppelin.com/contracts/4.x/api/proxy',
        'https://blog.openzeppelin.com/proxy-patterns/'
      ],
      tags: ['upgrades', 'proxy', 'security']
    },
    {
      id: 'gas-optimization',
      category: 'Gas Optimization',
      title: 'Optimize Gas Usage',
      description: 'Use gas-efficient patterns and data structures',
      codeExample: `contract GasOptimized {
    // Use uint256 for gas efficiency
    uint256 public value;
    
    // Pack related variables
    struct User {
        uint128 balance;
        uint128 lastUpdate;
    }
    
    // Use events instead of storage for historical data
    event UserUpdated(address indexed user, uint256 balance);
    
    // Batch operations
    function batchUpdate(address[] calldata users) external {
        for (uint i = 0; i < users.length; i++) {
            // Batch processing
        }
    }
}`,
      references: [
        'https://ethereum.org/en/developers/docs/gas/',
        'https://consensys.net/diligence/2019/09/stop-using-soliditys-transfer-now/'
      ],
      tags: ['gas', 'optimization', 'efficiency']
    }
  ]

  async generateRemediationPlan(vulnerability: Vulnerability): Promise<RemediationPlan> {
    const vulnerabilityType = this.detectVulnerabilityType(vulnerability)
    const fixes = this.vulnerabilityPatterns[vulnerabilityType]?.fixes || []
    
    const steps: RemediationStep[] = fixes.map((fix: any, index: number) => ({
      id: `${vulnerability.id}-step-${index + 1}`,
      title: fix.title,
      description: fix.description,
      code: fix.code,
      explanation: fix.explanation,
      difficulty: fix.difficulty,
      estimatedTime: fix.estimatedTime,
      riskLevel: fix.riskLevel,
      references: fix.references
    }))

    const totalTime = this.calculateTotalTime(steps)
    const priority = this.calculatePriority(vulnerability.severity)
    const confidence = this.calculateConfidence(vulnerability, vulnerabilityType)

    return {
      vulnerabilityId: vulnerability.id.toString(),
      vulnerabilityTitle: vulnerability.title,
      severity: vulnerability.severity,
      currentCode: vulnerability.description,
      steps,
      totalEstimatedTime: totalTime,
      priority,
      automated: false,
      aiGenerated: true,
      confidence
    }
  }

  async generateAutomatedFix(vulnerability: Vulnerability): Promise<string> {
    const vulnerabilityType = this.detectVulnerabilityType(vulnerability)
    const fixes = this.vulnerabilityPatterns[vulnerabilityType]?.fixes || []
    
    if (fixes.length === 0) {
      return this.generateGenericFix(vulnerability)
    }

    // Return the first (most recommended) fix
    return fixes[0].code
  }

  async getBestPractices(category?: string): Promise<SecurityBestPractice[]> {
    if (category) {
      return this.bestPractices.filter(practice => practice.category === category)
    }
    return this.bestPractices
  }

  async getSecurityRecommendations(vulnerabilities: Vulnerability[]): Promise<string[]> {
    const recommendations: string[] = []
    const categories = new Set<string>()

    vulnerabilities.forEach(vuln => {
      const type = this.detectVulnerabilityType(vuln)
      if (type) {
        categories.add(type)
      }
    })

    categories.forEach(category => {
      const practices = this.bestPractices.filter(p => p.category.toLowerCase() === category)
      practices.forEach(practice => {
        recommendations.push(`${practice.title}: ${practice.description}`)
      })
    })

    return recommendations
  }

  private detectVulnerabilityType(vulnerability: Vulnerability): string {
    const title = vulnerability.title.toLowerCase()
    const description = vulnerability.description.toLowerCase()

    if (title.includes('reentrancy') || description.includes('reentrancy')) {
      return 'reentrancy'
    }
    if (title.includes('overflow') || description.includes('overflow') || description.includes('underflow')) {
      return 'overflow'
    }
    if (title.includes('access') || description.includes('access control') || description.includes('permission')) {
      return 'access-control'
    }
    if (title.includes('unchecked') || description.includes('return value')) {
      return 'unchecked-return'
    }
    if (title.includes('timestamp') || description.includes('block.timestamp') || description.includes('now')) {
      return 'timestamp-dependence'
    }

    return 'generic'
  }

  private calculateTotalTime(steps: RemediationStep[]): string {
    const totalMinutes = steps.reduce((total, step) => {
      const time = step.estimatedTime
      const minutes = parseInt(time.split(' ')[0])
      const unit = time.split(' ')[1]
      
      if (unit.includes('hour')) {
        return total + (minutes * 60)
      }
      return total + minutes
    }, 0)

    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return `${hours}h ${minutes}m`
    }
    return `${totalMinutes}m`
  }

  private calculatePriority(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'critical':
        return 'critical'
      case 'high':
        return 'high'
      case 'medium':
        return 'medium'
      default:
        return 'low'
    }
  }

  private calculateConfidence(vulnerability: Vulnerability, type: string): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence based on pattern match
    if (type !== 'generic') {
      confidence += 0.2
    }

    // Increase confidence for specific vulnerability types
    if (type === 'reentrancy' || type === 'overflow') {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  private generateGenericFix(vulnerability: Vulnerability): string {
    return `// Generic fix for ${vulnerability.title}
// TODO: Implement specific fix based on vulnerability type

function secureFunction() external {
    // Add proper validation
    require(condition, "Error message");
    
    // Add access control if needed
    require(msg.sender == owner, "Unauthorized");
    
    // Add proper error handling
    try this.externalCall() {
        // Success handling
    } catch {
        // Error handling
    }
}`
  }
}

export default new RemediationService() 