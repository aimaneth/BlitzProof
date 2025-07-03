interface RemediationSuggestion {
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  category: string
  codeExample: string
  steps: string[]
  bestPractices: string[]
  references: string[]
}

class RemediationService {
  private remediationDatabase: Record<string, RemediationSuggestion> = {
    'reentrancy-eth': {
      title: 'Reentrancy Vulnerability',
      description: 'External calls can be exploited to re-enter the contract before state changes are applied.',
      severity: 'high',
      category: 'Access Control',
      codeExample: `// ❌ Vulnerable
function withdraw() external {
    uint256 amount = balances[msg.sender];
    require(amount > 0);
    
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    
    balances[msg.sender] = 0; // State change after external call
}

// ✅ Secure
function withdraw() external {
    uint256 amount = balances[msg.sender];
    require(amount > 0);
    
    balances[msg.sender] = 0; // State change before external call
    
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
}

// ✅ Using ReentrancyGuard
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecureContract is ReentrancyGuard {
    function withdraw() external nonReentrant {
        // Your withdrawal logic here
    }
}`,
      steps: [
        'Apply the check-effects-interactions pattern',
        'Update state variables before making external calls',
        'Consider using OpenZeppelin\'s ReentrancyGuard',
        'Validate all external calls and handle failures',
        'Test thoroughly with reentrancy attack scenarios'
      ],
      bestPractices: [
        'Always update state before external calls',
        'Use ReentrancyGuard for complex interactions',
        'Implement proper access controls',
        'Validate all inputs and outputs',
        'Use pull over push payment patterns'
      ],
      references: [
        'https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard',
        'https://consensys.net/diligence/audits/2019/12/defi-saver/#reentrancy-vulnerabilities',
        'https://swcregistry.io/docs/SWC-107'
      ]
    },
    'unchecked-transfer': {
      title: 'Unchecked External Call',
      description: 'External calls are not properly validated, potentially leading to silent failures.',
      severity: 'medium',
      category: 'External Calls',
      codeExample: `// ❌ Vulnerable
function transfer(address to, uint256 amount) external {
    // No validation of the transfer result
    to.call{value: amount}("");
}

// ✅ Secure
function transfer(address to, uint256 amount) external {
    require(to != address(0), "Invalid recipient");
    require(amount > 0, "Invalid amount");
    
    (bool success, ) = to.call{value: amount}("");
    require(success, "Transfer failed");
    
    emit Transfer(msg.sender, to, amount);
}`,
      steps: [
        'Always check the return value of external calls',
        'Validate all input parameters',
        'Implement proper error handling',
        'Use events to log important state changes',
        'Consider using OpenZeppelin\'s SafeERC20 for token transfers'
      ],
      bestPractices: [
        'Validate all external call results',
        'Use require statements for critical checks',
        'Implement comprehensive error handling',
        'Emit events for important operations',
        'Use established libraries like OpenZeppelin'
      ],
      references: [
        'https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#SafeERC20',
        'https://swcregistry.io/docs/SWC-104',
        'https://consensys.net/diligence/audits/2019/12/defi-saver/#unchecked-external-calls'
      ]
    },
    'integer-overflow': {
      title: 'Integer Overflow/Underflow',
      description: 'Arithmetic operations can overflow or underflow, leading to unexpected behavior.',
      severity: 'medium',
      category: 'Arithmetic',
      codeExample: `// ❌ Vulnerable (Solidity < 0.8.0)
function add(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b; // Can overflow
}

// ✅ Secure (Solidity >= 0.8.0)
function add(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b; // Built-in overflow protection
}

// ✅ Secure (Solidity < 0.8.0)
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SecureContract {
    using SafeMath for uint256;
    
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a.add(b); // SafeMath prevents overflow
    }
}`,
      steps: [
        'Upgrade to Solidity 0.8.0+ for built-in overflow protection',
        'Use SafeMath library for older Solidity versions',
        'Validate all arithmetic operations',
        'Test edge cases with maximum values',
        'Consider using checked math operations'
      ],
      bestPractices: [
        'Use Solidity 0.8.0+ when possible',
        'Implement SafeMath for older versions',
        'Validate all mathematical operations',
        'Test with boundary values',
        'Use appropriate data types'
      ],
      references: [
        'https://docs.openzeppelin.com/contracts/4.x/api/utils#SafeMath',
        'https://swcregistry.io/docs/SWC-101',
        'https://solidity.readthedocs.io/en/v0.8.0/080-breaking-changes.html'
      ]
    },
    'access-control': {
      title: 'Missing Access Control',
      description: 'Critical functions lack proper access controls, allowing unauthorized access.',
      severity: 'high',
      category: 'Access Control',
      codeExample: `// ❌ Vulnerable
function withdrawFunds() external {
    // Anyone can call this function
    payable(msg.sender).transfer(address(this).balance);
}

// ✅ Secure
contract SecureContract {
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    function withdrawFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}

// ✅ Using OpenZeppelin
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureContract is Ownable {
    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}`,
      steps: [
        'Implement proper access control modifiers',
        'Use OpenZeppelin\'s Ownable or AccessControl',
        'Validate all function parameters',
        'Implement role-based access control for complex systems',
        'Regularly audit access control mechanisms'
      ],
      bestPractices: [
        'Use established access control patterns',
        'Implement principle of least privilege',
        'Regularly review and update permissions',
        'Use events to log access control changes',
        'Test access control thoroughly'
      ],
      references: [
        'https://docs.openzeppelin.com/contracts/4.x/api/access',
        'https://swcregistry.io/docs/SWC-105',
        'https://consensys.net/diligence/audits/2019/12/defi-saver/#access-control'
      ]
    },
    'timestamp-dependence': {
      title: 'Timestamp Dependence',
      description: 'Using block.timestamp for critical logic can be manipulated by miners.',
      severity: 'medium',
      category: 'Blockchain',
      codeExample: `// ❌ Vulnerable
function claimReward() external {
    require(block.timestamp >= claimDeadline, "Too early");
    // Reward logic
}

// ✅ Secure
function claimReward() external {
    require(block.number >= claimBlock, "Too early");
    // Reward logic
}

// ✅ More Secure
contract SecureContract {
    uint256 public immutable claimDeadline;
    
    constructor(uint256 _claimDeadline) {
        claimDeadline = _claimDeadline;
    }
    
    function claimReward() external {
        require(block.timestamp >= claimDeadline, "Too early");
        // Additional validation and logic
    }
}`,
      steps: [
        'Avoid using block.timestamp for critical logic',
        'Use block numbers when possible',
        'Implement additional validation mechanisms',
        'Consider using commit-reveal schemes',
        'Add randomness from external sources'
      ],
      bestPractices: [
        'Use block numbers for time-sensitive operations',
        'Implement multiple validation layers',
        'Consider using VRF for randomness',
        'Add reasonable time buffers',
        'Test with different block times'
      ],
      references: [
        'https://swcregistry.io/docs/SWC-116',
        'https://docs.chain.link/docs/chainlink-vrf/',
        'https://consensys.net/diligence/audits/2019/12/defi-saver/#timestamp-dependence'
      ]
    }
  }

  getRemediation(vulnerabilityType: string): RemediationSuggestion | null {
    return this.remediationDatabase[vulnerabilityType] || null
  }

  getRemediationByTitle(title: string): RemediationSuggestion | null {
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    for (const [key, suggestion] of Object.entries(this.remediationDatabase)) {
      const normalizedSuggestionTitle = suggestion.title.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (normalizedSuggestionTitle.includes(normalizedTitle) || normalizedTitle.includes(normalizedSuggestionTitle)) {
        return suggestion
      }
    }
    
    return null
  }

  getAllRemediations(): RemediationSuggestion[] {
    return Object.values(this.remediationDatabase)
  }

  getRemediationsBySeverity(severity: 'high' | 'medium' | 'low'): RemediationSuggestion[] {
    return Object.values(this.remediationDatabase).filter(suggestion => suggestion.severity === severity)
  }

  getRemediationsByCategory(category: string): RemediationSuggestion[] {
    return Object.values(this.remediationDatabase).filter(suggestion => 
      suggestion.category.toLowerCase() === category.toLowerCase()
    )
  }
}

export const remediationService = new RemediationService()
export default remediationService 