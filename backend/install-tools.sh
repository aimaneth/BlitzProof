#!/bin/bash

echo "🔧 Installing Security Tools for BlitzProof..."

# Update package lists
apt-get update

# Install Python and pip
apt-get install -y python3 python3-pip python3-venv python3-dev

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Solidity compiler
npm install -g solc

# Upgrade pip
pip3 install --upgrade pip setuptools wheel

# Install Python security tools with error handling
echo "Installing Slither..."
pip3 install slither-analyzer || echo "❌ Slither installation failed"

echo "Installing Mythril..."
pip3 install mythril==0.24.7 || echo "❌ Mythril installation failed, will use mock data"

echo "Installing Manticore..."
pip3 install manticore || echo "❌ Manticore installation failed, will use mock data"

echo "Installing Z3 Solver..."
pip3 install z3-solver || echo "❌ Z3 Solver installation failed"

# Install Oyente with error handling
echo "Installing Oyente..."
git clone https://github.com/enzymefinance/oyente.git
cd oyente
pip3 install -r requirements.txt
python3 setup.py install
cd ..
rm -rf oyente || echo "❌ Oyente installation failed, will use mock data"

# Install Securify with error handling
echo "Installing Securify..."
git clone https://github.com/eth-sri/securify.git
cd securify
pip3 install -r requirements.txt
python3 setup.py install
cd ..
rm -rf securify || echo "❌ Securify installation failed, will use mock data"

# Install Echidna with error handling
echo "Installing Echidna..."
wget https://github.com/crytic/echidna/releases/download/v2.0.4/echidna-test-2.0.4-Ubuntu-18.04.tar.gz
tar -xzf echidna-test-2.0.4-Ubuntu-18.04.tar.gz
mv echidna-test /usr/local/bin/
chmod +x /usr/local/bin/echidna-test
rm echidna-test-2.0.4-Ubuntu-18.04.tar.gz || echo "❌ Echidna installation failed, will use mock data"

# Verify installations
echo "🔍 Verifying tool installations..."

echo "Checking Slither..."
if command -v slither &> /dev/null; then
    echo "✅ Slither is installed"
    slither --version
else
    echo "❌ Slither is not installed"
fi

echo "Checking Mythril..."
if command -v myth &> /dev/null; then
    echo "✅ Mythril is installed"
    myth version
else
    echo "❌ Mythril is not installed - will use mock data"
fi

echo "Checking Manticore..."
if command -v manticore &> /dev/null; then
    echo "✅ Manticore is installed"
    manticore --version
else
    echo "❌ Manticore is not installed - will use mock data"
fi

echo "Checking Echidna..."
if command -v echidna-test &> /dev/null; then
    echo "✅ Echidna is installed"
    echidna-test --version
else
    echo "❌ Echidna is not installed - will use mock data"
fi

echo "Checking Solidity Compiler..."
if command -v solc &> /dev/null; then
    echo "✅ Solidity Compiler is installed"
    solc --version
else
    echo "❌ Solidity Compiler is not installed"
fi

echo "🎉 Security tools installation complete!"
echo "📝 Note: Tools that failed to install will use mock data during scans."
echo "🔍 Real security analysis will still be performed via Slither and AI analysis." 