#!/bin/bash

echo "🔧 Installing Security Tools for BlitzProof..."

# Update package lists
apt-get update

# Install Python and pip
apt-get install -y python3 python3-pip python3-venv

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Solidity compiler
npm install -g solc

# Install Python security tools
pip3 install slither-analyzer
pip3 install mythril
pip3 install manticore
pip3 install z3-solver

# Install Oyente
git clone https://github.com/enzymefinance/oyente.git
cd oyente
pip3 install -r requirements.txt
python3 setup.py install
cd ..

# Install Securify
git clone https://github.com/eth-sri/securify.git
cd securify
pip3 install -r requirements.txt
python3 setup.py install
cd ..

# Install Echidna
wget https://github.com/crytic/echidna/releases/download/v2.0.4/echidna-test-2.0.4-Ubuntu-18.04.tar.gz
tar -xzf echidna-test-2.0.4-Ubuntu-18.04.tar.gz
mv echidna-test /usr/local/bin/
chmod +x /usr/local/bin/echidna-test

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
    echo "❌ Mythril is not installed"
fi

echo "Checking Manticore..."
if command -v manticore &> /dev/null; then
    echo "✅ Manticore is installed"
    manticore --version
else
    echo "❌ Manticore is not installed"
fi

echo "Checking Echidna..."
if command -v echidna-test &> /dev/null; then
    echo "✅ Echidna is installed"
    echidna-test --version
else
    echo "❌ Echidna is not installed"
fi

echo "Checking Solidity Compiler..."
if command -v solc &> /dev/null; then
    echo "✅ Solidity Compiler is installed"
    solc --version
else
    echo "❌ Solidity Compiler is not installed"
fi

echo "🎉 Security tools installation complete!" 